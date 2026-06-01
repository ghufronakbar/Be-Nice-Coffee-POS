const idrCurrencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatRupiah(value: number) {
  return idrCurrencyFormatter.format(value)
}

export function formatDateTime(value: Date) {
  return dateTimeFormatter.format(value)
}
