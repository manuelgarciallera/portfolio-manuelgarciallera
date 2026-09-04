import Image from 'next/image'

export function BuySellEditorialCover() {
  return (
    <span className="rd-buy-sell-cover" aria-hidden="true">
      <span className="rd-buy-sell-cover__aurora" />
      <span className="rd-buy-sell-cover__grid" />
      <span className="rd-buy-sell-cover__plane rd-buy-sell-cover__plane--cyan" />
      <span className="rd-buy-sell-cover__plane rd-buy-sell-cover__plane--coral" />
      <span className="rd-buy-sell-cover__coin rd-buy-sell-cover__coin--one" />
      <span className="rd-buy-sell-cover__coin rd-buy-sell-cover__coin--two" />
      <span className="rd-buy-sell-cover__coin rd-buy-sell-cover__coin--three" />

      <span className="rd-buy-sell-cover__lockup">
        <span className="rd-buy-sell-cover__logo-card">
          <Image src="/projects/buy-sell/logo-white.svg" alt="" width={118} height={28} priority />
        </span>
        <span className="rd-buy-sell-cover__line">Una identidad que se convierte en producto</span>
      </span>

      <span className="rd-buy-sell-cover__meta">Marketplace · Design system · Full stack</span>
      <span className="rd-buy-sell-cover__index">01 / Selección</span>
    </span>
  )
}
