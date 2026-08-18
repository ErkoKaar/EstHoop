// Need on Eesti Korvpalliliidu kontod, mitte EstHoopi omad.
// Kasutavad nii Navbar kui Footer, mõlemad tumedal taustal.

// Monokroomsed valged ikoonid, sest värvilised brändi-PNG-d ei sobinud sinisele ribale
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 320 512" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  {
    label: 'Eesti Korvpalliliit', href: 'https://www.basket.ee',
    render: () => <img src="/SocialMedia/basket_cropped.png" alt="" className="w-7 h-7 object-contain opacity-75 group-hover:opacity-100 transition-opacity duration-200" />,
  },
  {
    label: 'Instagram', href: 'https://www.instagram.com/basketee/?hl=en',
    render: () => <InstagramIcon className="w-5 h-5" />,
  },
  {
    label: 'Facebook', href: 'https://www.facebook.com/Basket.ee',
    render: () => <FacebookIcon className="h-5 w-auto" />,
  },
]

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-5">
      {SOCIAL_LINKS.map(({ label, href, render }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="group flex items-center justify-center rounded text-white/75 hover:text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          {render()}
        </a>
      ))}
    </div>
  )
}
