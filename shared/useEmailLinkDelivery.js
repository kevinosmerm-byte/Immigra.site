import {useEffect, useRef, useState} from 'react';
import {createEmailLinkDelivery} from './email-link-delivery.mjs';

export function useEmailLinkDelivery() {
  const delivery = useRef(null);
  if (!delivery.current) delivery.current = createEmailLinkDelivery();
  const [status, setStatus] = useState('idle');
  const [remaining, setRemaining] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!remaining) return;
    const timer = setInterval(() => setRemaining(delivery.current.remaining()), 1000);
    return () => clearInterval(timer);
  }, [remaining > 0]);
  async function send(request) {
    if (delivery.current.remaining() || status === 'sending') return false;
    setStatus('sending');
    const result = await delivery.current.send(request);
    if (mounted.current) {
      if (result.status !== 'waiting') setStatus(result.status);
      setRemaining(delivery.current.remaining());
    }
    return result.status === 'sent';
  }
  return {status, remaining, send};
}
