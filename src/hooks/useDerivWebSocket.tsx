import { useState, useEffect, useRef, useCallback } from "react";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";
const DERIV_APP_ID = "1089";

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
  onTick?: (tick: TickData) => void;
  onProposal?: (proposal: ProposalData) => void;
  onContractUpdate?: (contract: ContractData) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useDerivWebSocket(options: UseDerivWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${DERIV_WS_URL}?app_id=${DERIV_APP_ID}`);

    ws.onopen = () => {
      console.log("Deriv WebSocket connected");
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
            options.onProposal?.({
              id: data.proposal.id,
              ask_price: data.proposal.ask_price,
              payout: data.proposal.payout,
              spot: data.proposal.spot,
              spot_time: data.proposal.spot_time,
            });
          }
          break;

        case "buy":
          if (data.error) {
            options.onError?.(data.error.message);
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

      // Attempt reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      options.onError?.("Connection error");
    };

    wsRef.current = ws;
  }, [options.token]);

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
    duration_unit: "s" | "m" | "h" | "d";
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

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [options.token]);

  return {
    isConnected,
    isAuthorized,
    balance,
    currency,
    send,
    subscribeTicks,
    unsubscribeTicks,
    getProposal,
    buyContract,
    sellContract,
    disconnect,
    reconnect: connect,
  };
}
