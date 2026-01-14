import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";

export interface TickData {
  symbol: string;
  quote: number;
  epoch: number;
}

export interface ProposalData {
  id: string;
  ask_price: number;
  payout: number;
  spot: number;
  spot_time: number;
}

export interface ContractData {
  contract_id: number;
  status: "open" | "sold" | "won" | "lost";
  profit: number;
  buy_price: number;
  current_spot: number;
}

interface UseDerivWebSocketOptions {
  token?: string;
  appId?: string;
  onTick?: (tick: TickData) => void;
  onProposal?: (proposal: ProposalData) => void;
  onContractUpdate?: (contract: ContractData) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthorize?: (data: AuthorizeData) => void;
}

export interface AuthorizeData {
  balance: number;
  currency: string;
  loginid: string;
  fullname: string;
  email: string;
  accounts: Array<{
    loginid: string;
    currency: string;
    is_virtual: number;
  }>;
}

export function useDerivWebSocket(options: UseDerivWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");
  const [appId, setAppId] = useState<string>(options.appId || "");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const proposalCallbacksRef = useRef<Map<string, (proposal: ProposalData) => void>>(new Map());

  // Fetch app ID from platform settings if not provided
  useEffect(() => {
    if (!options.appId) {
      fetchAppId();
    }
  }, [options.appId]);

  const fetchAppId = async () => {
    try {
      const { data } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "deriv_app_id")
        .maybeSingle();
      
      if (data?.setting_value) {
        setAppId(data.setting_value);
      } else {
        // Default fallback
        setAppId("1089");
      }
    } catch (err) {
      console.error("Error fetching app ID:", err);
      setAppId("1089");
    }
  };

  const connect = useCallback(() => {
    if (!appId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${DERIV_WS_URL}?app_id=${appId}`);

    ws.onopen = () => {
      console.log("Deriv WebSocket connected with App ID:", appId);
      setIsConnected(true);
      options.onConnect?.();

      // Authorize if token provided
      if (options.token) {
        ws.send(JSON.stringify({ authorize: options.token }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.msg_type) {
        case "authorize":
          if (data.error) {
            options.onError?.(data.error.message);
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
            setBalance(data.authorize.balance);
            setCurrency(data.authorize.currency);
            
            options.onAuthorize?.({
              balance: data.authorize.balance,
              currency: data.authorize.currency,
              loginid: data.authorize.loginid,
              fullname: data.authorize.fullname,
              email: data.authorize.email,
              accounts: data.authorize.account_list || [],
            });
            
            // Subscribe to balance updates
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
          }
          break;

        case "balance":
          if (data.balance) {
            setBalance(data.balance.balance);
            setCurrency(data.balance.currency);
          }
          break;

        case "tick":
          if (data.tick) {
            options.onTick?.({
              symbol: data.tick.symbol,
              quote: data.tick.quote,
              epoch: data.tick.epoch,
            });
          }
          break;

        case "proposal":
          if (data.proposal) {
            const proposalData: ProposalData = {
              id: data.proposal.id,
              ask_price: data.proposal.ask_price,
              payout: data.proposal.payout,
              spot: data.proposal.spot,
              spot_time: data.proposal.spot_time,
            };
            options.onProposal?.(proposalData);
            
            // Check for registered callback
            const reqId = data.req_id?.toString();
            if (reqId && proposalCallbacksRef.current.has(reqId)) {
              proposalCallbacksRef.current.get(reqId)?.(proposalData);
              proposalCallbacksRef.current.delete(reqId);
            }
          } else if (data.error) {
            options.onError?.(data.error.message);
          }
          break;

        case "buy":
          if (data.error) {
            options.onError?.(data.error.message);
          } else if (data.buy) {
            // Subscribe to contract updates
            ws.send(JSON.stringify({ 
              proposal_open_contract: 1, 
              contract_id: data.buy.contract_id,
              subscribe: 1 
            }));
          }
          break;

        case "proposal_open_contract":
          if (data.proposal_open_contract) {
            const poc = data.proposal_open_contract;
            options.onContractUpdate?.({
              contract_id: poc.contract_id,
              status: poc.status,
              profit: poc.profit,
              buy_price: poc.buy_price,
              current_spot: poc.current_spot,
            });
          }
          break;

        case "sell":
          if (data.error) {
            options.onError?.(data.error.message);
          }
          break;

        case "error":
          options.onError?.(data.error?.message || "Unknown error");
          break;
      }
    };

    ws.onclose = () => {
      console.log("Deriv WebSocket disconnected");
      setIsConnected(false);
      setIsAuthorized(false);
      options.onDisconnect?.();

      // Attempt reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      options.onError?.("Connection error");
    };

    wsRef.current = ws;
  }, [appId, options.token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribeTicks = useCallback((symbol: string) => {
    if (subscriptionsRef.current.has(symbol)) return;
    subscriptionsRef.current.add(symbol);
    send({ ticks: symbol, subscribe: 1 });
  }, [send]);

  const unsubscribeTicks = useCallback((symbol: string) => {
    subscriptionsRef.current.delete(symbol);
    send({ forget_all: "ticks" });
  }, [send]);

  const getProposal = useCallback((params: {
    symbol: string;
    contract_type: "CALL" | "PUT";
    duration: number;
    duration_unit: "s" | "m" | "h" | "d" | "t";
    amount: number;
    basis: "stake" | "payout";
  }) => {
    send({
      proposal: 1,
      amount: params.amount,
      basis: params.basis,
      contract_type: params.contract_type,
      currency: currency,
      duration: params.duration,
      duration_unit: params.duration_unit,
      symbol: params.symbol,
    });
  }, [send, currency]);

  const getProposalAsync = useCallback((params: {
    symbol: string;
    contract_type: "CALL" | "PUT" | "DIGITEVEN" | "DIGITODD" | "DIGITOVER" | "DIGITUNDER";
    duration: number;
    duration_unit: "s" | "m" | "h" | "d" | "t";
    amount: number;
    basis: "stake" | "payout";
    barrier?: number;
  }): Promise<ProposalData> => {
    return new Promise((resolve, reject) => {
      const reqId = Date.now().toString();
      
      proposalCallbacksRef.current.set(reqId, resolve);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (proposalCallbacksRef.current.has(reqId)) {
          proposalCallbacksRef.current.delete(reqId);
          reject(new Error("Proposal timeout"));
        }
      }, 10000);

      const message: Record<string, unknown> = {
        proposal: 1,
        req_id: parseInt(reqId),
        amount: params.amount,
        basis: params.basis,
        contract_type: params.contract_type,
        currency: currency,
        duration: params.duration,
        duration_unit: params.duration_unit,
        symbol: params.symbol,
      };

      if (params.barrier !== undefined) {
        message.barrier = params.barrier;
      }

      send(message);
    });
  }, [send, currency]);

  const buyContract = useCallback((proposalId: string, price: number) => {
    send({
      buy: proposalId,
      price: price,
    });
  }, [send]);

  const sellContract = useCallback((contractId: number, price: number) => {
    send({
      sell: contractId,
      price: price,
    });
  }, [send]);

  // Connect when app ID is available
  useEffect(() => {
    if (appId) {
      connect();
    }
    return () => disconnect();
  }, [appId, options.token]);

  return {
    isConnected,
    isAuthorized,
    balance,
    currency,
    appId,
    send,
    subscribeTicks,
    unsubscribeTicks,
    getProposal,
    getProposalAsync,
    buyContract,
    sellContract,
    disconnect,
    reconnect: connect,
  };
}
