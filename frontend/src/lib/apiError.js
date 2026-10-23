export const apiError = (detail, fallback = 'Algo deu errado. Tente novamente.') => {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] || {};
    const field = (first.loc || []).slice(-1)[0];
    if (field === 'email') return 'E-mail inválido';
    if (field === 'password') return 'Senha inválida';
    return first.msg || fallback;
  }
  return detail.msg || fallback;
};
