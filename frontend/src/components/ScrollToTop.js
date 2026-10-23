import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const scrollAllToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll('[data-scroll-container], main').forEach((el) => { el.scrollTop = 0; });
};

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => { scrollAllToTop(); }, [pathname]);
  return null;
}
