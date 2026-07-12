import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Chatbot } from '../chatbot/Chatbot';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
