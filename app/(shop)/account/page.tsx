'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useServiceability } from '@/store/serviceability';
import { fetchUserOrders, timeAgo } from '@/lib/orders';
import { find, catOf } from '@/lib/data';
import { Img } from '@/components/ui/Img';
import { rupee } from '@/components/ui/Price';
import type { Order, Address } from '@/lib/types';

function initialsOf(name: string, email: string): string {
  const base = name.trim() || email.trim() || 'U';
  return base
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  bgColor: string;
  target: string;
}

interface Coupon {
  code: string;
  discount: string;
  desc: string;
  minOrder: number;
}

interface UPIAccount {
  id: string;
  vpa: string;
  provider: string;
  isPrimary: boolean;
}

interface SavedCard {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  brand: string;
}

function AccountContent() {
  const router = useRouter();
  const { user, addresses, selectedAddr, signOut, updateUserProfile, setSelectedAddr } = useAuth();
  const { cartCount, addToCart, showToast } = useCart();
  const { pincode, detect, locationName } = useServiceability();

  const activeAddr = addresses?.find((a) => a.id === selectedAddr) || addresses?.[0];

  useEffect(() => {
    if (!pincode && !activeAddr) {
      detect();
    }
  }, [pincode, activeAddr, detect]);

  const locationLabel = activeAddr?.label 
    || (locationName && pincode 
        ? `${locationName} (${pincode})` 
        : locationName || pincode || 'Set location');

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Shared navigation states
  const [activeTab, setActiveTab] = useState<string>('orders'); // Desktop
  const [mobileView, setMobileView] = useState<string | null>(null); // Mobile sub-screen view
  
  // Wallet states
  const [walletBalance, setWalletBalance] = useState<number>(350);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  
  // Edit profile states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Payments states
  const [upiAccounts, setUpiAccounts] = useState<UPIAccount[]>([
    { id: '1', vpa: 'user@okaxis', provider: 'Axis Bank', isPrimary: true },
    { id: '2', vpa: 'user@paytm', provider: 'Paytm UPI', isPrimary: false }
  ]);
  const [newUpi, setNewUpi] = useState('');
  const [isAddingUpi, setIsAddingUpi] = useState(false);

  const [savedCards, setSavedCards] = useState<SavedCard[]>([
    { id: '1', number: '•••• •••• •••• 4242', holder: 'FreshMart Shopper', expiry: '12/28', brand: 'Visa' }
  ]);
  const [newCardNum, setNewCardNum] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExp, setNewCardExp] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Support/Live chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    { sender: 'bot', text: 'Hi! I am Weekly Market Support Assistant. How can I help you today?', time: 'Just now' }
  ]);

  // Settings Toggles
  const [notifications, setNotifications] = useState(true);
  const [emailPromo, setEmailPromo] = useState(false);
  const [smsPromo, setSmsPromo] = useState(true);
  const [language, setLanguage] = useState('English');

  // Fetch user orders
  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserOrders(user.uid)
      .then((list) => active && setOrders(list))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoadingOrders(false));
    return () => {
      active = false;
    };
  }, [user]);

  // Coupons data
  const coupons: Coupon[] = useMemo(() => [
    { code: 'GROW50', discount: '₹50 OFF', desc: 'Valid on orders above ₹299', minOrder: 299 },
    { code: 'FRESHDEL', discount: 'FREE DELIVERY', desc: 'Valid on first 3 organic orders', minOrder: 0 },
    { code: 'WELCOME100', discount: '₹100 CASHBACK', desc: 'Get ₹100 in wallet on orders above ₹999', minOrder: 999 }
  ], []);

  // Quick Action items
  const quickActions: QuickAction[] = [
    { id: 'orders', label: 'My Orders', icon: 'receipt', color: 'text-rose-600', bgColor: 'bg-rose-50', target: 'orders' },
    { id: 'track', label: 'Track Order', icon: 'truck', color: 'text-emerald-600', bgColor: 'bg-emerald-50', target: 'track' },
    { id: 'addresses', label: 'Saved Addresses', icon: 'pin', color: 'text-blue-600', bgColor: 'bg-blue-50', target: 'addresses' },
    { id: 'wallet', label: 'Wallet Balance', icon: 'wallet', color: 'text-amber-600', bgColor: 'bg-amber-50', target: 'wallet' },
    { id: 'payments', label: 'Payment Options', icon: 'card', color: 'text-purple-600', bgColor: 'bg-purple-50', target: 'payments' },
    { id: 'coupons', label: 'Coupons & Offers', icon: 'tag', color: 'text-orange-600', bgColor: 'bg-orange-50', target: 'coupons' },
    { id: 'refer', label: 'Refer & Earn', icon: 'spark', color: 'text-pink-600', bgColor: 'bg-pink-50', target: 'refer' },
    { id: 'notifications', label: 'Alert Settings', icon: 'info', color: 'text-indigo-600', bgColor: 'bg-indigo-50', target: 'settings' }
  ];

  const activeDeliveries = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  const pastOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
  }, [orders]);

  // Actions
  const handleSignOut = async () => {
    await signOut();
    showToast('Logged out successfully');
    router.push(routes.auth());
  };

  const handleEditProfile = () => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setIsEditProfileOpen(true);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name cannot be empty');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateUserProfile({ name: editName, phone: editPhone });
      showToast('Profile updated successfully');
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    setWalletBalance(prev => prev + amt);
    showToast(`₹${amt} added to wallet successfully!`);
    setAddAmount('');
    setIsAddMoneyOpen(false);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Promo code "${code}" copied!`);
  };

  const handleAddUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpi.trim() || !newUpi.includes('@')) {
      showToast('Please enter a valid UPI ID');
      return;
    }
    const id = Date.now().toString();
    setUpiAccounts(prev => [...prev, { id, vpa: newUpi.trim(), provider: 'Custom UPI', isPrimary: false }]);
    setNewUpi('');
    setIsAddingUpi(false);
    showToast('UPI Account linked successfully!');
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNum.trim() || newCardNum.length < 15) {
      showToast('Please enter a valid card number');
      return;
    }
    const id = Date.now().toString();
    const masked = '•••• •••• •••• ' + newCardNum.slice(-4);
    setSavedCards(prev => [...prev, {
      id,
      number: masked,
      holder: newCardHolder.trim() || 'Cardholder',
      expiry: newCardExp.trim() || '09/30',
      brand: newCardNum.startsWith('4') ? 'Visa' : 'Mastercard'
    }]);
    setNewCardNum('');
    setNewCardHolder('');
    setNewCardExp('');
    setIsAddingCard(false);
    showToast('Card details saved successfully!');
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((it) => addToCart(it.productId, it.qty));
    showToast('Items added to cart');
    router.push(routes.cart());
  };

  const sendChatMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg = { sender: 'user' as const, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    setTimeout(() => {
      let replyText = "I'm checking that for you. Can you please confirm your order details?";
      const lower = text.toLowerCase();
      if (lower.includes('order') || lower.includes('where')) {
        if (activeDeliveries.length > 0) {
          replyText = `Your active order #${activeDeliveries[0].id} is currently ${activeDeliveries[0].status.replace(/_/g, ' ')}. Our delivery executive is enroute and will arrive in approximately 12 minutes!`;
        } else if (orders.length > 0) {
          replyText = `Your last order #${orders[0].id} was successfully delivered. Let me know if you need assistance with any specific item or invoice.`;
        } else {
          replyText = "I see you haven't placed any orders yet! Feel free to browse our catalog page to place your first fresh delivery.";
        }
      } else if (lower.includes('refund') || lower.includes('cancel')) {
        replyText = "We process refunds immediately to your Weekly Market wallet. If you cancel a pending order, the refund appears instantly. For cards/UPI, it may take 3-5 business days.";
      } else if (lower.includes('wallet') || lower.includes('balance') || lower.includes('money')) {
        replyText = `Your current wallet balance is ₹${walletBalance}. You can use this balance at checkout for instant one-click payments!`;
      } else if (lower.includes('address') || lower.includes('location')) {
        replyText = "You can manage your saved delivery locations inside the 'Saved Addresses' section of your profile dashboard.";
      }
      
      setChatMessages(prev => [...prev, {
        sender: 'bot' as const,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  // Navigate function matching mobile / desktop modes
  const handleItemClick = (target: string) => {
    // For Desktop
    if (target === 'orders' || target === 'track') setActiveTab('orders');
    else if (target === 'addresses' || target === 'wallet' || target === 'payments') setActiveTab('addresses');
    else if (target === 'coupons' || target === 'refer') setActiveTab('rewards');
    else if (target === 'support' || target === 'chat' || target === 'faq') setActiveTab('support');
    else if (target === 'settings') setActiveTab('settings');

    // For Mobile
    setMobileView(target);
  };

  if (!user) return null;

  return (
    <div className="growexy-page min-h-screen bg-[#f4f6fb] font-sans text-neutral-900 pb-16">
      {/* Hide storefront default layouts chrome override */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .app > .hdr,
          .app > .mobtop,
          .app > .footer {
            display: none !important;
          }
          .main {
            padding: 0 !important;
            max-width: 100% !important;
            background: #f4f6fb !important;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `
      }} />

      {/* WEEKLY MARKET HEADER */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={routes.home()} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </span>
              <span>
                Weekly <span className="text-emerald-600 font-extrabold">Market</span>
              </span>
            </Link>

            <button 
              onClick={() => router.push(routes.addresses())}
              className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50/60 px-3.5 py-1.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left max-w-[200px] sm:max-w-[240px] truncate"
            >
              <span className="text-emerald-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div className="flex flex-col text-[10px] sm:text-xs">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight leading-none">Deliver to</span>
                <span className="font-extrabold text-neutral-800 truncate mt-0.5 max-w-[120px] sm:max-w-[150px] leading-tight">{locationLabel}</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link href={routes.cart()} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href={routes.account()}
              className="flex h-9 items-center justify-center rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {user.name.split(' ')[0]}
            </Link>
          </div>
        </div>
      </header>

      {/* ==================== DESKTOP LAYOUT (1024px and up) ==================== */}
      <main className="hidden lg:block mx-auto max-w-7xl px-6 py-8">
        {/* Profile Header Card */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#d2efff] via-[#e6f5ff] to-white p-8 mb-8 shadow-sm">
          <div className="flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 font-extrabold text-3xl text-white shadow-lg shadow-emerald-100 select-none">
                {initialsOf(user.name, user.email)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-neutral-900 tracking-tight leading-none">{user.name}</h1>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm shadow-emerald-100 flex items-center gap-1">
                    <Icon name="spark" size={10} />
                    VIP GOLD MEMBER
                  </span>
                </div>
                <p className="text-neutral-500 text-sm font-medium flex items-center gap-3">
                  <span className="flex items-center gap-1 text-neutral-700 font-bold">
                    <Icon name="phone" size={12} />
                    {user.phone || 'No phone linked'}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="flex items-center gap-1 text-neutral-600 font-bold">
                    <Icon name="mail" size={12} />
                    {user.email}
                  </span>
                </p>
                <div className="text-xs text-neutral-400 font-semibold">
                  Member since June 2026
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleEditProfile}
                className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-bold px-5 py-2.5 text-xs tracking-tight shadow-sm transition-all"
              >
                <Icon name="edit" size={14} className="text-emerald-600" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('settings'); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-5 py-2.5 text-xs tracking-tight transition-all"
              >
                <Icon name="bolt" size={14} className="text-amber-400 animate-spin-slow" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="mb-8">
          <h2 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4">Quick Shortcuts</h2>
          <div className="grid grid-cols-8 gap-4">
            {quickActions.map((act) => (
              <button
                key={act.id}
                onClick={() => {
                  handleItemClick(act.target);
                  if (act.id === 'wallet') setIsAddMoneyOpen(true);
                  document.getElementById('desktop-details')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col justify-between items-start p-4 rounded-2xl bg-white border border-neutral-100 hover:border-emerald-200/50 shadow-sm hover:shadow-md transition-all text-left"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${act.bgColor} ${act.color} group-hover:scale-110 duration-200 transition-transform`}>
                  <Icon name={act.icon} size={20} />
                </span>
                <span className="mt-4 font-extrabold text-neutral-900 text-xs tracking-tight leading-tight">{act.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Desktop Split View Dashboard */}
        <div className="grid grid-cols-12 gap-8 items-start" id="desktop-details">
          {/* Left Navigation bar */}
          <aside className="col-span-4 space-y-4">
            {/* Wallet quick balance */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Icon name="wallet" size={20} />
                  </span>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Wallet Balance</span>
                    <span className="text-lg font-black text-neutral-900 leading-none">₹{walletBalance.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddMoneyOpen(true)}
                  className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-1.5 text-xs font-bold transition-all"
                >
                  + Add Cash
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">★</span>
                  <span>750 Loyalty Coins</span>
                </div>
                <button onClick={() => { setActiveTab('rewards'); }} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                  Redeem
                </button>
              </div>
            </div>

            <nav className="rounded-3xl border border-neutral-100 bg-white p-2 shadow-sm space-y-1">
              {[
                { id: 'orders', label: 'Orders & Shopping', icon: 'receipt' as IconName },
                { id: 'addresses', label: 'Addresses & Payments', icon: 'pin' as IconName },
                { id: 'rewards', label: 'Rewards & Offers', icon: 'tag' as IconName },
                { id: 'support', label: 'Help & Live Support', icon: 'phone' as IconName },
                { id: 'settings', label: 'Settings & Preferences', icon: 'bolt' as IconName }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={tab.icon} size={18} />
                    <span>{tab.label}</span>
                  </div>
                  <Icon name="chevR" size={14} className={activeTab === tab.id ? 'text-white' : 'text-neutral-400'} />
                </button>
              ))}
            </nav>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-3.5 text-sm transition-all shadow-sm"
            >
              <Icon name="trash" size={16} />
              <span>Log Out of Weekly Market</span>
            </button>
          </aside>

          {/* Right Detail Pane */}
          <section className="col-span-8 bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm min-h-[500px]">
            {activeTab === 'orders' && <OrdersTabContent />}
            {activeTab === 'addresses' && <AddressesTabContent />}
            {activeTab === 'rewards' && <RewardsTabContent />}
            {activeTab === 'support' && <SupportTabContent />}
            {activeTab === 'settings' && <SettingsTabContent />}
          </section>
        </div>
      </main>

      {/* ==================== MOBILE LAYOUT (Blinkit-Style) ==================== */}
      <main className="block lg:hidden min-h-screen pb-20">
        
        {mobileView === null ? (
          /* MAIN SCROLLABLE MOBILE PROFILE FEED */
          <div className="space-y-4 px-4 pt-4">
            
            {/* Sticky/Top Mobile Profile Header */}
            <div className="p-4 rounded-3xl bg-white border border-neutral-100 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 font-extrabold text-xl text-white shadow-md shadow-emerald-100">
                  {initialsOf(user.name, user.email)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-base text-neutral-900 tracking-tight">{user.name}</h2>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">VIP</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-bold leading-none">{user.phone || 'No phone linked'}</p>
                  <p className="text-[10px] text-neutral-400 font-medium leading-none truncate max-w-[160px]">{user.email}</p>
                </div>
              </div>
              
              <button 
                onClick={handleEditProfile}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200/50"
              >
                <Icon name="edit" size={14} className="text-emerald-600" />
              </button>
            </div>

            {/* Quick Actions Horizontal Scroll/Grid */}
            <div className="grid grid-cols-4 gap-2">
              {quickActions.slice(0, 4).map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    handleItemClick(act.target);
                    if (act.id === 'wallet') setIsAddMoneyOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-neutral-100/70 shadow-sm active:scale-95 duration-100 transition-all text-center"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${act.bgColor} ${act.color}`}>
                    <Icon name={act.icon} size={18} />
                  </span>
                  <span className="mt-2 text-[10px] font-bold text-neutral-800 leading-tight block truncate w-full">{act.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Wallet Quick bar */}
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Icon name="wallet" size={16} />
                </span>
                <span className="text-xs font-bold text-neutral-700">Wallet Balance: <strong className="text-neutral-900">₹{walletBalance.toFixed(2)}</strong></span>
              </div>
              <button 
                onClick={() => setIsAddMoneyOpen(true)}
                className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg"
              >
                + Add Cash
              </button>
            </div>

            {/* Active Delivery Highlight sticky header */}
            {activeDeliveries.length > 0 && (
              <div 
                onClick={() => handleItemClick('track')}
                className="p-3.5 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-white/20 rounded-lg">
                    <Icon name="truck" size={18} className="text-white" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block leading-none">Ongoing Delivery</span>
                    <span className="text-xs font-bold leading-tight block mt-0.5">Arriving in 15 mins ({activeDeliveries.length} active order)</span>
                  </div>
                </div>
                <Icon name="chevR" size={16} className="text-white" />
              </div>
            )}

            {/* BLINKIT-STYLE GROUPED MENU CARDS */}
            <div className="space-y-4">
              
              {/* Group 1: Orders & Shopping */}
              <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden p-1.5">
                <div className="px-3 py-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-50">Orders & Shopping</div>
                
                {[
                  { label: 'Active Orders', val: activeDeliveries.length > 0 ? `${activeDeliveries.length} Active` : 'None', icon: 'truck' as IconName, click: 'track' },
                  { label: 'Order History', val: `${pastOrders.length} Completed`, icon: 'receipt' as IconName, click: 'orders' },
                  { label: 'Reorder Items', val: 'Fast reorder', icon: 'clock' as IconName, click: 'reorder' },
                  { label: 'Scheduled Deliveries', val: 'Subscriptions', icon: 'bolt' as IconName, click: 'scheduled' },
                  { label: 'Favorite Products', val: 'My picks', icon: 'heart' as IconName, click: 'favorites' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.click)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 rounded-2xl text-left border-b border-neutral-50/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500"><Icon name={item.icon} size={16} /></span>
                      <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold">{item.val}</span>
                      <Icon name="chevR" size={14} className="text-neutral-300" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Group 2: Addresses & Payments */}
              <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden p-1.5">
                <div className="px-3 py-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-50">Addresses & Payments</div>
                
                {[
                  { label: 'Saved Addresses', val: `${addresses.length} Locations`, icon: 'pin' as IconName, click: 'addresses' },
                  { label: 'Wallet Balance', val: `₹${walletBalance.toFixed(2)}`, icon: 'wallet' as IconName, click: 'wallet' },
                  { label: 'UPI Accounts', val: `${upiAccounts.length} Linked`, icon: 'bank' as IconName, click: 'upi' },
                  { label: 'Saved Cards', val: `${savedCards.length} Saved`, icon: 'card' as IconName, click: 'cards' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.click)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 rounded-2xl text-left border-b border-neutral-50/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500"><Icon name={item.icon} size={16} /></span>
                      <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold">{item.val}</span>
                      <Icon name="chevR" size={14} className="text-neutral-300" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Group 3: Rewards & Offers */}
              <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden p-1.5">
                <div className="px-3 py-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-50">Rewards & Offers</div>
                
                {[
                  { label: 'Coupons & Promo Codes', val: `${coupons.length} Active`, icon: 'tag' as IconName, click: 'coupons' },
                  { label: 'Loyalty Rewards', val: '750 Coins', icon: 'spark' as IconName, click: 'rewards' },
                  { label: 'Refer & Earn', val: 'Earn ₹150', icon: 'leaf' as IconName, click: 'refer' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.click)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 rounded-2xl text-left border-b border-neutral-50/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500"><Icon name={item.icon} size={16} /></span>
                      <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold">{item.val}</span>
                      <Icon name="chevR" size={14} className="text-neutral-300" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Group 4: Support */}
              <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden p-1.5">
                <div className="px-3 py-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-50">Customer Support</div>
                
                {[
                  { label: 'Help Center & FAQs', icon: 'info' as IconName, click: 'faq' },
                  { label: 'Start Live Support Chat', icon: 'phone' as IconName, click: 'chat' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.click)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 rounded-2xl text-left border-b border-neutral-50/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500"><Icon name={item.icon} size={16} /></span>
                      <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                    </div>
                    <Icon name="chevR" size={14} className="text-neutral-300" />
                  </button>
                ))}
              </div>

              {/* Group 5: Settings */}
              <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden p-1.5">
                <div className="px-3 py-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-50">App Settings</div>
                
                {/* Inline Push Toggle */}
                <div className="flex items-center justify-between p-3.5 border-b border-neutral-50/55">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500"><Icon name="bolt" size={16} /></span>
                    <span className="text-xs font-bold text-neutral-800">Push Notifications</span>
                  </div>
                  <button 
                    onClick={() => { setNotifications(!notifications); showToast('Notifications toggled'); }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications ? 'bg-emerald-600' : 'bg-neutral-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <button
                  onClick={() => handleItemClick('settings')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 rounded-2xl text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500"><Icon name="info" size={16} /></span>
                    <span className="text-xs font-bold text-neutral-800">Languages & More Settings</span>
                  </div>
                  <Icon name="chevR" size={14} className="text-neutral-300" />
                </button>
              </div>

            </div>

            {/* Logout Mobile */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-3.5 text-xs transition-all shadow-sm"
            >
              <Icon name="trash" size={14} />
              <span>Log Out of Weekly Market Account</span>
            </button>

          </div>
        ) : (
          /* MOBILE SUB-PAGE SLIDE-UP DRAWER INTERFACE */
          <div className="fixed inset-0 z-50 bg-[#f4f6fb] flex flex-col h-full overflow-hidden">
            {/* Slide up screen header */}
            <div className="bg-white px-4 py-4 border-b border-neutral-100 flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setMobileView(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-50 border border-neutral-200"
              >
                <Icon name="back" size={16} className="text-neutral-600" />
              </button>
              <h3 className="font-extrabold text-base text-neutral-800 capitalize leading-none">
                {mobileView.replace('-', ' ')}
              </h3>
            </div>

            {/* Slide up screen content scroll */}
            <div className="grow overflow-y-auto p-4 space-y-4 no-scrollbar">
              {(mobileView === 'orders' || mobileView === 'track' || mobileView === 'reorder') && <OrdersTabContent />}
              {(mobileView === 'addresses' || mobileView === 'wallet' || mobileView === 'payments' || mobileView === 'upi' || mobileView === 'cards') && <AddressesTabContent />}
              {(mobileView === 'coupons' || mobileView === 'rewards' || mobileView === 'refer') && <RewardsTabContent />}
              {(mobileView === 'chat' || mobileView === 'faq') && <SupportTabContent />}
              {(mobileView === 'settings') && <SettingsTabContent />}
              
              {/* Fallback for undeveloped items */}
              {['favorites', 'scheduled'].includes(mobileView) && (
                <div className="text-center py-16 bg-white rounded-3xl border border-neutral-100 space-y-3">
                  <span className="text-4xl block">⏳</span>
                  <h4 className="font-bold text-neutral-800 text-sm">Feature coming soon</h4>
                  <p className="text-xs text-neutral-400 font-medium px-6">Our engineering team is packaging the {mobileView} modules in our upcoming release!</p>
                  <Button size="sm" onClick={() => setMobileView(null)}>Go Back</Button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* GROWEXY FOOTER (Shared) */}
      <footer className="mx-auto max-w-7xl px-6 pt-16 mt-16 border-t border-neutral-100 text-left bg-white hidden lg:block">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          <div className="space-y-4">
            <Link href={routes.home()} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </span>
              <span>
                Weekly <span className="text-emerald-600 font-extrabold">Market</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              Weekly Market is your premier local green grocer, providing farm-fresh produce, natural dairy, and raw organics delivered directly to your doorstep.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href="#" className="hover:text-emerald-600">About Us</Link></li>
              <li><Link href={routes.browse()} className="hover:text-emerald-600">Shop Catalog</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Our Brands</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Partner Program</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Support</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href={routes.support()} className="hover:text-emerald-600">Help Center</Link></li>
              <li><Link href={routes.addresses()} className="hover:text-emerald-600">Delivery Areas</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Terms of Use</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Contact Us</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-bold">
              Have questions? Reach out at:
              <br />
              <strong className="text-neutral-850">support@weeklymarket.com</strong>
            </p>
          </div>
        </div>
        <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Weekly Market. All rights reserved.
        </div>
      </footer>

      {/* ==================== MODAL SUB-COMPONENTS ==================== */}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-neutral-100">
            <button 
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 text-lg font-black animate-none"
            >
              ✕
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">Edit Profile</h3>
              <p className="text-xs text-neutral-455 font-medium">Update your account name and mobile details</p>
            </div>
            
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter phone number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-sm shadow-emerald-100 mt-2"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WALLET TOP-UP MODAL */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-neutral-100">
            <button 
              onClick={() => setIsAddMoneyOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 text-lg font-black animate-none"
            >
              ✕
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">Add Money to Wallet</h3>
              <p className="text-xs text-neutral-400 font-medium">Use wallet balance for lightning-fast checkouts</p>
            </div>
            
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Top-up Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={5000}
                  placeholder="Enter amount (e.g. ₹500)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAddAmount(val.toString())}
                    className="border border-neutral-200 hover:border-emerald-500 rounded-xl py-2 text-xs font-bold text-neutral-600 hover:text-emerald-700 transition-colors bg-neutral-50/50"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-sm shadow-emerald-100 mt-2"
              >
                Proceed to Pay
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // ==================== NESTED PANEL CONTENTS ====================

  // Orders Tab Content
  function OrdersTabContent() {
    return (
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Icon name="receipt" className="text-emerald-600" />
            Orders & Shopping
          </h2>
          <p className="text-xs text-neutral-500 font-medium">Track active orders, view past items, or schedule deliveries</p>
        </div>

        {loadingOrders ? (
          <div className="space-y-4 pt-4">
            <div className="h-24 w-full rounded-2xl bg-neutral-100 animate-pulse"></div>
            <div className="h-24 w-full rounded-2xl bg-neutral-100 animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Active Deliveries / Ongoing Tracking */}
            {activeDeliveries.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                  Active Orders ({activeDeliveries.length})
                </span>
                <div className="space-y-4">
                  {activeDeliveries.map(o => (
                    <div key={o.id} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white tracking-tight leading-none">
                            <Icon name="truck" size={10} />
                            Arriving in 15 mins
                          </span>
                          <div className="mt-2 font-black text-neutral-950 text-sm">Order #{o.id}</div>
                        </div>
                        <span className="text-xs font-semibold text-neutral-400">{timeAgo(o.placedAt)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                          <span>Packed & Ready</span>
                          <span className="text-emerald-700">Out for delivery</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                          <div className="h-full w-3/4 rounded-full bg-emerald-600 animate-pulse"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100/50">
                        <span className="text-xs font-bold text-neutral-500">
                          {o.items.reduce((a, b) => a + b.qty, 0)} items • {rupee(o.totals.grand)}
                        </span>
                        <Button 
                          size="sm" 
                          iconRight="arrowR"
                          onClick={() => router.push(routes.confirm(o.id))}
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Reorder Widget */}
            {orders.length > 0 && (
              <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-lg">🔁</span>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-sm">Quick Reorder Previous Items</h3>
                    <p className="text-[11px] text-neutral-500 font-medium">Instantly add items from your last order to your cart</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white border border-amber-100/50 rounded-xl p-3.5">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {orders[0].items.slice(0, 3).map((it) => {
                      const product = find(it.productId);
                      return (
                        <div key={it.productId} className="h-8 w-8 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-sm flex items-center justify-center text-[10px] font-black">
                          {product?.name[0] || 'I'}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleReorder(orders[0])}
                    className="bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg transition-all"
                  >
                    Reorder {orders[0].items.length} Items
                  </button>
                </div>
              </div>
            )}

            {/* Past Completed Orders list */}
            <div className="space-y-3">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
                Past Completed Orders
              </span>
              {pastOrders.length === 0 && activeDeliveries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-neutral-100 rounded-2xl space-y-4 bg-white">
                  <span className="text-4xl block">📦</span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-800 text-sm">No orders yet</h4>
                    <p className="text-xs text-neutral-400 font-medium max-w-[240px] mx-auto">Your past fresh marketplace orders will show up here</p>
                  </div>
                  <Button size="sm" onClick={() => router.push(routes.browse())} iconRight="arrowR">
                    Shop Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map(o => (
                    <div key={o.id} className="p-4 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 transition-all flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-neutral-500">Order #{o.id}</span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 font-extrabold uppercase px-2 py-0.5 rounded">
                            {o.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                          <span>{timeAgo(o.placedAt)}</span>
                          <span>•</span>
                          <span>{o.items.reduce((a, b) => a + b.qty, 0)} items</span>
                        </div>
                        <div className="flex -space-x-1.5 overflow-hidden pt-1">
                          {o.items.slice(0, 4).map((it) => {
                            const product = find(it.productId);
                            return (
                              <div key={it.productId} className="h-6 w-6 rounded-md border border-white bg-neutral-50 overflow-hidden flex items-center justify-center text-[8px] font-black shadow-sm">
                                {product?.name[0] || 'I'}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex sm:flex-col justify-between items-end sm:items-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-55">
                        <span className="font-black text-neutral-900 text-sm">{rupee(o.totals.grand)}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleReorder(o)}>
                            Buy Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // Addresses & Payments Tab Content
  function AddressesTabContent() {
    return (
      <div className="space-y-8">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Icon name="pin" className="text-emerald-600" />
            Addresses & Payments
          </h2>
          <p className="text-xs text-neutral-500 font-medium">Manage your delivery locations, UPI IDs, and saved cards</p>
        </div>

        {/* Saved Locations */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Saved Addresses</span>
            <button 
              onClick={() => router.push(routes.addresses())}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold"
            >
              + Add New
            </button>
          </div>
          {addresses.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-neutral-200 rounded-2xl bg-white">
              <p className="text-xs text-neutral-400 font-bold">No saved addresses</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr: Address) => (
                <div 
                  key={addr.id}
                  onClick={() => { setSelectedAddr(addr.id); showToast(`Default address set to ${addr.label}`); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    selectedAddr === addr.id
                      ? 'border-emerald-500 bg-emerald-50/10 shadow-sm'
                      : 'border-neutral-100 bg-white hover:border-neutral-200'
                  }`}
                >
                  {selectedAddr === addr.id && (
                    <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded">
                      {addr.type}
                    </span>
                    <span className="font-extrabold text-neutral-900 text-sm">{addr.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-550 leading-normal truncate">
                    {addr.line1}, {addr.line2 && `${addr.line2}, `}{addr.city} - {addr.pin}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400 font-semibold">{addr.name} • {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Saved Cards */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Saved Credit/Debit Cards</span>
            <button 
              onClick={() => setIsAddingCard(!isAddingCard)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold"
            >
              {isAddingCard ? 'Cancel' : '+ Save Card'}
            </button>
          </div>

          {isAddingCard && (
            <form onSubmit={handleAddCard} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3 max-w-md">
              <div className="text-xs font-bold text-neutral-700">Add Credit/Debit Card</div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Card Number (16 Digits)"
                  maxLength={16}
                  value={newCardNum}
                  onChange={(e) => setNewCardNum(e.target.value.replace(/\D/g, ''))}
                  className="col-span-3 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Cardholder Name"
                  value={newCardHolder}
                  onChange={(e) => setNewCardHolder(e.target.value)}
                  className="col-span-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={newCardExp}
                  onChange={(e) => setNewCardExp(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                Save Card Details
              </button>
            </form>
          )}

          {savedCards.length === 0 ? (
            <p className="text-xs text-neutral-400 font-semibold">No saved cards.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCards.map(card => (
                <div key={card.id} className="p-4 rounded-2xl bg-neutral-900 text-white shadow-md relative overflow-hidden flex flex-col justify-between h-28">
                  <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full"></span>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">{card.brand}</span>
                    <button 
                      onClick={() => { setSavedCards(prev => prev.filter(c => c.id !== card.id)); showToast('Card removed'); }}
                      className="text-white/40 hover:text-white transition-colors text-xs font-black"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm font-mono tracking-widest">{card.number}</div>
                  <div className="flex justify-between items-end text-[10px]">
                    <span className="font-bold truncate max-w-[120px]">{card.holder}</span>
                    <span className="font-mono">{card.expiry}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPI Payments linked */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Linked UPI Accounts</span>
            <button 
              onClick={() => setIsAddingUpi(!isAddingUpi)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold"
            >
              {isAddingUpi ? 'Cancel' : '+ Link UPI'}
            </button>
          </div>

          {isAddingUpi && (
            <form onSubmit={handleAddUpi} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3 max-w-md flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="e.g. username@upi"
                value={newUpi}
                onChange={(e) => setNewUpi(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500 grow"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shrink-0">
                Link Account
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {upiAccounts.map(upi => (
              <div key={upi.id} className="flex justify-between items-center p-3 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 transition-all">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black">UPI</span>
                  <div>
                    <span className="text-xs font-extrabold text-neutral-900 block leading-tight">{upi.vpa}</span>
                    <span className="text-[9px] text-neutral-400 font-semibold">{upi.provider}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {upi.isPrimary ? (
                    <span className="text-[9px] text-emerald-700 bg-emerald-100/50 font-bold px-2 py-0.5 rounded">Primary</span>
                  ) : (
                    <button 
                      onClick={() => {
                        setUpiAccounts(prev => prev.map(u => ({ ...u, isPrimary: u.id === upi.id })));
                        showToast('Primary UPI ID updated');
                      }}
                      className="text-[9px] text-neutral-400 hover:text-neutral-700 font-bold px-2 py-0.5 rounded border border-neutral-200"
                    >
                      Set Primary
                    </button>
                  )}
                  <button 
                    onClick={() => { setUpiAccounts(prev => prev.filter(u => u.id !== upi.id)); showToast('UPI account unlinked'); }}
                    className="text-neutral-350 hover:text-rose-500 font-extrabold text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Rewards Tab Content
  function RewardsTabContent() {
    return (
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Icon name="tag" className="text-emerald-600" />
            Rewards & Offers
          </h2>
          <p className="text-xs text-neutral-500 font-medium">Claim active cashback rewards, discount vouchers, or refer friends</p>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
          <div className="space-y-2 max-w-sm text-center sm:text-left">
            <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest block">Invite Friends & Earn</span>
            <h3 className="text-lg font-black uppercase leading-tight">Get ₹150 Free Discount</h3>
            <p className="text-[10px] text-white/70 font-semibold">Share your referral link. When your friend places their first organic grocery order of ₹499+, you both get ₹150 instantly!</p>
          </div>
          <button 
            onClick={() => { navigator.clipboard.writeText('https://growexy.com/invite?code=VIPGOLD'); showToast('Invite link copied!'); }}
            className="bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-xs px-5 py-2.5 rounded-full shadow-md shadow-amber-200 transition-all grow-0 shrink-0"
          >
            Copy Link
          </button>
        </div>

        <div className="space-y-3.5">
          <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Available Coupons</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map(cp => (
              <div key={cp.code} className="p-4 rounded-2xl border border-neutral-100 bg-white hover:border-emerald-200 transition-all flex flex-col justify-between h-32 relative shadow-sm">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-50 border-r border-neutral-100"></span>
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-50 border-l border-neutral-100"></span>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-emerald-700 block">{cp.discount}</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">{cp.desc}</span>
                  </div>
                  <button 
                    onClick={() => handleCopyCoupon(cp.code)}
                    className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-extrabold px-3 py-1 rounded-full transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex justify-between items-end border-t border-neutral-50 pt-2 mt-2">
                  <span className="text-[10px] font-bold text-neutral-400">PROMO CODE</span>
                  <span className="font-mono font-black text-xs tracking-wider text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200/50">{cp.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3">
          <div className="text-xs font-extrabold text-neutral-800">Cashback & Coins History</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-neutral-500 py-1.5 border-b border-neutral-200/50">
              <span>Referral Reward - Friend Sign up</span>
              <span className="text-emerald-600">+₹150.00 Wallet</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-neutral-500 py-1.5 border-b border-neutral-200/50">
              <span>Order #GW-3821 - Coins Earned</span>
              <span className="text-amber-600">+50 Coins</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Support Tab Content
  function SupportTabContent() {
    return (
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Icon name="phone" className="text-emerald-600" />
            Help Center & Live Chat
          </h2>
          <p className="text-xs text-neutral-500 font-medium">Resolve issues with recent orders, payments, or start live chat</p>
        </div>

        {/* Live support Chat box */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm flex flex-col h-[380px]">
          <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-ping"></span>
              <div>
                <span className="font-extrabold text-sm block leading-none">Weekly Market Assistant Bot</span>
                <span className="text-[9px] font-semibold text-emerald-100">Usually replies instantly</span>
              </div>
            </div>
            <button 
              onClick={() => { setChatMessages([{ sender: 'bot', text: 'Hi! How can I help you today?', time: 'Just now' }]); }}
              className="text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Clear
            </button>
          </div>

          <div className="grow p-4 overflow-y-auto space-y-3.5 bg-neutral-50 no-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium relative ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white text-neutral-800 border border-neutral-100 shadow-sm rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className={`block text-[8px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-neutral-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-neutral-100 bg-white overflow-x-auto flex gap-2 no-scrollbar shrink-0">
            {[
              'Where is my order?',
              'Refund status',
              'Wallet issue',
              'Contact human agent'
            ].map((s) => (
              <button
                key={s}
                onClick={() => sendChatMessage(s)}
                className="rounded-full border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/20 px-3 py-1 text-[10px] font-bold text-neutral-600 hover:text-emerald-700 transition-all shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-neutral-100 bg-white flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder="Type your message here..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all grow"
            />
            <button 
              onClick={() => sendChatMessage()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 w-8 flex items-center justify-center transition-colors shrink-0"
            >
              ✈
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">FAQs</span>
          <div className="space-y-2">
            {[
              { q: 'What is the average delivery time?', a: 'Under our express program, we deliver fresh organic groceries and items within 15-25 minutes!' },
              { q: 'How do I use Weekly Market Wallet balance?', a: 'Your wallet balance will automatically show at checkout as a payment option. Select it to pay in a single tap!' }
            ].map((faq, i) => (
              <details key={i} className="group p-3 rounded-xl border border-neutral-100 bg-white cursor-pointer select-none">
                <summary className="font-extrabold text-xs text-neutral-800 flex justify-between items-center list-none">
                  <span>{faq.q}</span>
                  <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed font-medium pl-1">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Settings Tab Content
  function SettingsTabContent() {
    return (
      <div className="space-y-6">
        <div className="hidden lg:block">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Icon name="bolt" className="text-emerald-600 animate-spin-slow" />
            Account Settings & Preferences
          </h2>
          <p className="text-xs text-neutral-500 font-medium">Manage push notifications, communication preferences, and security settings</p>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 space-y-4">
          <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Alert Preferences</span>
          
          <div className="flex items-center justify-between py-1 border-b border-neutral-50">
            <div>
              <span className="text-xs font-extrabold text-neutral-800 block">Push Notifications</span>
              <span className="text-[10px] text-neutral-400 font-medium">Order delivery updates & arrival alerts</span>
            </div>
            <button 
              onClick={() => { setNotifications(!notifications); showToast('Preferences updated'); }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                notifications ? 'bg-emerald-600' : 'bg-neutral-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-50">
            <div>
              <span className="text-xs font-extrabold text-neutral-800 block">Email Promo Vouchers</span>
              <span className="text-[10px] text-neutral-400 font-medium">Weekly discount vouchers and hot organic deals</span>
            </div>
            <button 
              onClick={() => { setEmailPromo(!emailPromo); showToast('Preferences updated'); }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                emailPromo ? 'bg-emerald-600' : 'bg-neutral-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                emailPromo ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-extrabold text-neutral-800 block">WhatsApp / SMS updates</span>
              <span className="text-[10px] text-neutral-400 font-medium">Quick bills & checkout payment confirmations</span>
            </div>
            <button 
              onClick={() => { setSmsPromo(!smsPromo); showToast('Preferences updated'); }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                smsPromo ? 'bg-emerald-600' : 'bg-neutral-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                smsPromo ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 space-y-3">
          <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Select App Language</span>
          <div className="flex flex-wrap gap-2">
            {['English', 'Hindi (हिंदी)', 'Bengali', 'Tamil'].map(lang => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); showToast(`Language changed to ${lang}`); }}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                  language === lang
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 text-rose-800 text-xs font-medium space-y-1.5">
          <div className="font-extrabold text-rose-950 flex items-center gap-1">🛡 Privacy & Security Notice</div>
          <p className="leading-relaxed">Your account session is active on this device. If you notice any unauthorized actions, modify your security password immediately.</p>
        </div>
      </div>
    );
  }
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
