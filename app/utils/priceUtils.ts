export const formatPrice = (price: number, currency: string): string => {
  if (currency === 'USD' || currency === 'EUR') {
    return price.toFixed(2);
  } else {
    return Math.round(price).toString();
  }
};