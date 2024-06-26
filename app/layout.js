import './globals.css'
import styles from './page.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import FarmFriendNavDropdown from './components/FarmFriendNavDropdown';
import BootstrapClient from './components/BootstrapClient';
import AccountDropdown from './components/AccountDropdown.js';
import { SpeedInsights } from "@vercel/speed-insights/next"



export const metadata = {
  title: 'Farm Friend',
  description: 'A companion for your fruitful farming efforts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body>
        <nav className={`${styles.mainNavbar} d-flex justify-content-between align-items-center`} style={{padding: '1rem'}}>      
          <FarmFriendNavDropdown />
          <AccountDropdown />
        </nav>
        <section>
          <main className={`${styles.mainContent}`}>
            {children}
          </main>
        </section>
        <BootstrapClient />        
        <SpeedInsights/>
      </body>
    </html>
  );
}
