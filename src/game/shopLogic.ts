export function shopForIndoorUnit(u: any, r: any) {
  if (!u || u.dead || u.y >= 147) return null;
  if (u.lootShop && !u.lootShop.looted) return u.lootShop;
  for (const p of r.props) {
    if (p.kind === "shop" && !p.looted && Math.abs(u.x - p.x) < 90) return p;
  }
  return null;
}
