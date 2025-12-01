function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function assert(name: string, cond: boolean) {
  if (!cond) throw new Error("Test failed: " + name);
  console.log("ok:", name);
}

const total = 1000;
const paid = 300;
const pending = Math.max(0, total - paid);
assert("pending calc", pending === 700);
assert("format BRL", formatBRL(700).includes("R$"));

