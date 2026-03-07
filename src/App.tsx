import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";

// ==========================================
// INYECCIÓN FORZADA DE DISEÑO (TAILWIND CSS)
// ==========================================
if (typeof window !== "undefined" && !document.getElementById("tailwind-cdn")) {
  const script = document.createElement("script");
  script.id = "tailwind-cdn";
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
}

// ==========================================
// CONSTANTES Y REGLAS DE NEGOCIO
// ==========================================
const ROLES = {
  ADMIN: "Fiduciante Original (Administrador)",
  FIDUCIANTE: "Fiduciante Activo",
  NO_FIDUCIANTE: "No Fiduciante"
};

const TOTAL_CDPS = 413;
const SESSION_KEY = "cdp_session_v23";

// ==========================================
// ÍCONOS INTEGRADOS
// ==========================================
const SvgIcon = ({ children, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

const IconMail = (props: any) => <SvgIcon {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></SvgIcon>;
const IconLock = (props: any) => <SvgIcon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></SvgIcon>;
const IconUser = (props: any) => <SvgIcon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></SvgIcon>;
const IconPhone = (props: any) => <SvgIcon {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></SvgIcon>;
const IconFileText = (props: any) => <SvgIcon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></SvgIcon>;
const IconChevronRight = (props: any) => <SvgIcon {...props}><path d="m9 18 6-6-6-6" /></SvgIcon>;
const IconLogOut = (props: any) => <SvgIcon {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></SvgIcon>;
const IconShield = (props: any) => <SvgIcon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></SvgIcon>;
const IconCheckCircle = (props: any) => <SvgIcon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></SvgIcon>;
const IconAlertCircle = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></SvgIcon>;
const IconTrash2 = (props: any) => <SvgIcon {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></SvgIcon>;
const IconEdit = (props: any) => <SvgIcon {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></SvgIcon>;
const IconCreditCard = (props: any) => <SvgIcon {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></SvgIcon>;
const IconBuilding = (props: any) => <SvgIcon {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></SvgIcon>;
const IconSettings = (props: any) => <SvgIcon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></SvgIcon>;
const IconX = (props: any) => <SvgIcon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></SvgIcon>;
const IconInfo = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></SvgIcon>;
const IconCloud = (props: any) => <SvgIcon {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></SvgIcon>;
const IconGrid = (props: any) => <SvgIcon {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></SvgIcon>;
const IconList = (props: any) => <SvgIcon {...props}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></SvgIcon>;
const IconDollarSign = (props: any) => <SvgIcon {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></SvgIcon>;
const IconTag = (props: any) => <SvgIcon {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></SvgIcon>;
const IconFolder = (props: any) => <SvgIcon {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></SvgIcon>;
const IconTrendingUp = (props: any) => <SvgIcon {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></SvgIcon>;
const IconExternalLink = (props: any) => <SvgIcon {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></SvgIcon>;
const IconClock = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></SvgIcon>;
const IconSave = (props: any) => <SvgIcon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></SvgIcon>;
const IconShoppingCart = (props: any) => <SvgIcon {...props}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></SvgIcon>;

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS FIREBASE
// ==========================================
const codeSandboxFirebaseConfig = {
  apiKey: "AIzaSyAKURp61wvvL-YfYhfUQzVsl4sQX69TCHc",
  authDomain: "mercado-cdp-violetas.firebaseapp.com",
  projectId: "mercado-cdp-violetas",
  storageBucket: "mercado-cdp-violetas.firebasestorage.app",
  messagingSenderId: "1035972951086",
  appId: "1:1035972951086:web:6ff86cbf17dd4c1a0533bf"
};

const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined' ? JSON.parse((window as any).__firebase_config) : codeSandboxFirebaseConfig;

let app: any, auth: any, db: any, appId: string;

if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'mi-mercado-cdp';
}

const formatId = (num: number) => `#${String(num).padStart(4, "0")}`;

const getLocalDateString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const getUserRole = (user: any, cdps: any[]) => {
  if (user.isAdmin || user.correlativeId === 1) return ROLES.ADMIN;
  const ownsCdp = cdps.some((c: any) => c.ownerId === user.id);
  return ownsCdp ? ROLES.FIDUCIANTE : ROLES.NO_FIDUCIANTE;
};

// ==========================================
// COMPONENTES UI REUTILIZABLES
// ==========================================

const Spinner = ({ className = "w-5 h-5" }: any) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Button = ({ children, variant = "primary", isLoading = false, icon: Icon, className = "", ...props }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-900/20",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30",
    outline: "border-2 border-slate-200 hover:border-violet-500 text-slate-700 hover:text-violet-700 bg-transparent",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <Spinner /> : (Icon && typeof Icon === 'function' && <Icon className="w-5 h-5 shrink-0" />)}
      {children}
    </button>
  );
};

const InputField = ({ label, icon: Icon, error, ...props }: any) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>}
    <div className="relative">
      {Icon && typeof Icon === 'function' && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon className="w-5 h-5" /></div>}
      <input
        className={`w-full bg-slate-50 border ${error ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-violet-500"} text-slate-800 rounded-2xl py-3 px-4 ${Icon ? "pl-12" : ""} outline-none focus:ring-2 transition-all`}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-red-500 font-medium ml-1">{error}</span>}
  </div>
);

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 ${className}`}>
    {children}
  </div>
);

// ==========================================
// MODALES GLOBALES Y ESPECÍFICOS
// ==========================================

const GlobalModal = ({ isOpen, type, title, message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar" }: any) => {
  if (!isOpen) return null;
  const icons: any = {
    success: <IconCheckCircle className="w-12 h-12 text-green-500" />,
    error: <IconAlertCircle className="w-12 h-12 text-red-500" />,
    info: <IconInfo className="w-12 h-12 text-violet-500" />,
    confirm: <IconAlertCircle className="w-12 h-12 text-amber-500" />,
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={type === "confirm" ? onCancel : onConfirm}></div>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl scale-100 animate-in zoom-in-95 flex flex-col items-center text-center">
        <div className="mb-4 bg-slate-50 p-4 rounded-full">{icons[type]}</div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-8">{message}</p>
        <div className="flex gap-3 w-full">
          {type === "confirm" && <Button variant="outline" className="flex-1" onClick={onCancel}>{cancelText}</Button>}
          <Button variant={type === "error" ? "danger" : "primary"} className="flex-1" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

const AdminEditModal = ({ user, onClose, onUpdate, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState({ ...user });
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e: any) => setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: any) => { e.preventDefault(); setIsLoading(true); await onUpdate(user.id, formData); setIsLoading(false); showGlobalMessage("success", "Usuario Actualizado", "Los datos personales se guardaron correctamente."); onClose(); };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div><div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">Editar Fiduciante</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><IconX className="w-6 h-6 text-slate-500" /></button></div><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required /><InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required /><InputField label="CUIT/CUIL" name="cuit" value={formData.cuit} onChange={handleChange} required /><InputField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} required /><InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required /><InputField label="Contraseña" name="password" value={formData.password} onChange={handleChange} required /></div><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Guardar Cambios</Button></div></form></div></div>
  );
};

const OperacionModal = ({ operacion, users, onClose, onSave, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState(operacion || { numero: "", cdpNumber: "", vendedorId: "", compradorId: "", monto: "", fecha: getLocalDateString() });
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e: any) => { e.preventDefault(); if (formData.vendedorId === formData.compradorId && formData.vendedorId !== "") { showGlobalMessage("error", "Error", "El vendedor y comprador no pueden ser el mismo."); return; } setIsLoading(true); await onSave(formData); setIsLoading(false); showGlobalMessage("success", "Operación Registrada", "El registro se guardó correctamente."); onClose(); };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div><div className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">{operacion ? "Editar Operación" : "Nueva Operación"}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><IconX className="w-6 h-6 text-slate-500" /></button></div><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><InputField label="Nº Operación" type="number" name="numero" value={formData.numero} onChange={handleChange} required /><InputField label="Nº CDP" type="number" name="cdpNumber" min="1" max={TOTAL_CDPS} value={formData.cdpNumber} onChange={handleChange} required /><InputField label="Fecha" type="date" name="fecha" value={formData.fecha} onChange={handleChange} required /></div><div className="flex flex-col gap-1 w-full mt-2"><label className="text-sm font-semibold text-slate-600 ml-1">Fiduciante Vendedor</label><select className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" name="vendedorId" value={formData.vendedorId} onChange={handleChange} required><option value="">-- Seleccionar --</option><option value="base_owner_sergio">Sergio Gabriel Argumedo Rosello</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>)}</select></div><div className="flex flex-col gap-1 w-full mt-2"><label className="text-sm font-semibold text-slate-600 ml-1">Fiduciante Comprador</label><select className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" name="compradorId" value={formData.compradorId} onChange={handleChange} required><option value="">-- Seleccionar --</option><option value="base_owner_sergio">Sergio Gabriel Argumedo Rosello</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>)}</select></div><InputField icon={IconDollarSign} label="Monto (USD)" type="number" name="monto" min="0" step="0.01" value={formData.monto} onChange={handleChange} required /><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Guardar</Button></div></form></div></div>
  );
};

const OfertaModal = ({ oferta, users, cdps, nextOfertaNum, onClose, onSave, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState(oferta || { numero: String(nextOfertaNum), cdpNumber: "", vendedorId: "", monto: "", fecha: getLocalDateString(), vencimiento: getLocalDateString() });
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: any) => { e.preventDefault(); setIsLoading(true); await onSave(formData); setIsLoading(false); showGlobalMessage("success", "Oferta Registrada", "La oferta fue publicada."); onClose(); };
  const handleCdpChange = (e: any) => { const val = e.target.value; const num = Number(val); let newVendedorId = formData.vendedorId; if (num >= 1 && num <= TOTAL_CDPS) { const cdp = cdps.find((c:any) => c.number === num); if (cdp) newVendedorId = cdp.ownerId; } setFormData({ ...formData, cdpNumber: val, vendedorId: newVendedorId }); };
  const handleVendedorChange = (e: any) => { setFormData({ ...formData, vendedorId: e.target.value, cdpNumber: "" }); };
  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div><div className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">{oferta ? "Editar Oferta" : "Nueva Oferta"}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><IconX className="w-6 h-6 text-slate-500" /></button></div><form onSubmit={handleSubmit} className="space-y-4"><div className="bg-violet-50 p-4 rounded-xl border border-violet-100 mb-2"><InputField label="Nº de Oferta (Automático)" type="number" name="numero" value={formData.numero} onChange={handleChange} required /></div><div className="flex flex-col gap-1 w-full"><label className="text-sm font-semibold text-slate-600 ml-1">Vendedor</label><select className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" name="vendedorId" value={formData.vendedorId} onChange={handleVendedorChange} required><option value="">-- Seleccionar --</option><option value="base_owner_sergio">Sergio Gabriel Argumedo Rosello</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>)}</select></div><div className="flex flex-col gap-1 w-full"><label className="text-sm font-semibold text-slate-600 ml-1">Nº CDP a la venta</label>{formData.vendedorId ? (<select className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" name="cdpNumber" value={formData.cdpNumber} onChange={handleCdpChange} required><option value="">-- Seleccionar CDP --</option>{cdps.filter((c:any) => c.ownerId === formData.vendedorId).map((c:any) => <option key={c.number} value={c.number}>CDP Nº {c.number}</option>)}</select>) : (<input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" name="cdpNumber" min="1" max={TOTAL_CDPS} value={formData.cdpNumber} onChange={handleCdpChange} placeholder="Escriba el Nº de CDP..." required />)}</div><InputField icon={IconDollarSign} label="Monto Solicitado (USD)" type="number" name="monto" min="0" step="0.01" value={formData.monto} onChange={handleChange} required /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><InputField label="Publicación" type="date" name="fecha" value={formData.fecha} onChange={handleChange} required /><InputField label="Vencimiento" type="date" name="vencimiento" value={formData.vencimiento} onChange={handleChange} required /></div><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Guardar Oferta</Button></div></form></div></div>
  );
};

const BovedaModal = ({ bovedaItem, onClose, onSave, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState(bovedaItem || { cdpNumber: "", titulo: "", url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: any) => { e.preventDefault(); setIsLoading(true); await onSave(formData); setIsLoading(false); showGlobalMessage("success", "Guardado", "Documento vinculado exitosamente."); onClose(); };
  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div><div className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">{bovedaItem ? "Editar Doc" : "Vincular Doc"}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><IconX className="w-6 h-6 text-slate-500" /></button></div><form onSubmit={handleSubmit} className="space-y-4"><InputField label="Nº CDP Asociado" type="number" name="cdpNumber" min="1" max={TOTAL_CDPS} value={formData.cdpNumber} onChange={handleChange} required /><InputField icon={IconFileText} label="Título del Archivo" name="titulo" value={formData.titulo} onChange={handleChange} required /><InputField icon={IconCloud} label="Enlace Web (URL)" type="url" name="url" placeholder="https://drive.google.com/..." value={formData.url} onChange={handleChange} required /><div className="flex gap-3 pt-4"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Guardar</Button></div></form></div></div>
  );
};

// ==========================================
// NUEVO: MODAL DE SOLICITUD DE OFERTA (COMPRA/VENTA)
// ==========================================
const UserOfferModal = ({ isOpen, offerType, user, onClose, onSave, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState({ nombres: "", apellidos: "", cuit: "", telefono: "", email: "", monto: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        nombres: user?.nombres || "", 
        apellidos: user?.apellidos || "", 
        cuit: user?.cuit || "", 
        telefono: user?.telefono || "", 
        email: user?.email || "", 
        monto: "" 
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e: any) => { 
    e.preventDefault(); 
    setIsLoading(true); 
    await onSave({ ...formData, tipo: offerType }); 
    setIsLoading(false); 
    showGlobalMessage("success", "Oferta Enviada", `Tu solicitud de ${offerType.toLowerCase()} fue registrada exitosamente.`); 
    onClose(); 
  };

  const isCompra = offerType === "COMPRA";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {isCompra ? <IconShoppingCart className="w-6 h-6 text-violet-600"/> : <IconTag className="w-6 h-6 text-violet-600"/>}
            Oferta de {isCompra ? "Compra" : "Venta"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><IconX className="w-6 h-6 text-slate-500" /></button>
        </div>
        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl mb-6 text-sm flex gap-3 items-start border border-blue-100">
           <IconInfo className="w-5 h-5 shrink-0 mt-0.5" />
           <p>Verifica tus datos de contacto. Recuerda que el monto debe ser expresado estrictamente en <b>Dólares Estadounidenses (U$S)</b>.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
            <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="CUIT / CUIL" name="cuit" value={formData.cuit} onChange={handleChange} required />
            <InputField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} required />
          </div>
          <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          
          <div className="pt-2">
            <InputField icon={IconDollarSign} label="Monto de la Oferta (U$S)" type="number" name="monto" min="1" step="0.01" value={formData.monto} onChange={handleChange} placeholder="Ej: 5000" required />
          </div>
          
          <div className="flex gap-3 pt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>Enviar Oferta</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE: GRÁFICO DE MERCADO
// ==========================================
const MarketChart = ({ operaciones, simplified = false, savedConfig = null, onSaveConfig = null, showGlobalMessage = null }: any) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultConfig = { filterYear: "Todos", yMin: "", yMax: "", yStep: "", xMin: "", xMax: "", xStep: "30" };
  const [localConfig, setLocalConfig] = useState(savedConfig || defaultConfig);

  useEffect(() => {
    if (savedConfig) setLocalConfig(savedConfig);
  }, [savedConfig]);

  const activeConfig = simplified ? (savedConfig || defaultConfig) : localConfig;

  const opsConMonto = operaciones.filter((op:any) => op.monto && op.fecha && !isNaN(Number(op.monto)));
  const aniosDisponibles = ["Todos", ...Array.from(new Set(opsConMonto.map((op:any) => op.fecha.substring(0,4)))).sort().reverse()];

  const dataFiltrada = activeConfig.filterYear === "Todos"
      ? opsConMonto
      : opsConMonto.filter((op:any) => op.fecha.startsWith(activeConfig.filterYear));

  const data = dataFiltrada
      .map((op:any) => ({ dateMs: new Date(op.fecha + "T00:00:00").getTime(), monto: Number(op.monto), fechaStr: formatDateForDisplay(op.fecha), id: op.id }))
      .sort((a:any, b:any) => a.dateMs - b.dateMs);

  if (data.length < 2) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 min-h-[300px]">
           <IconTrendingUp className="w-12 h-12 text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-600">Datos Insuficientes</h3>
           <p className="text-slate-500 mt-2 text-center text-sm">Se requieren al menos 2 operaciones para trazar la curva.</p>
        </div>
      );
  }

  const width = 800;
  const height = 400;
  const paddingX = simplified ? 55 : 70;
  const paddingY = simplified ? 25 : 50;

  const dataMinY = Math.min(...data.map((d:any) => d.monto));
  const dataMaxY = Math.max(...data.map((d:any) => d.monto));
  const rangeYData = dataMaxY - dataMinY || 100;

  const dataMinX = data[0].dateMs;
  const dataMaxX = data[data.length - 1].dateMs;
  const rangeXData = dataMaxX - dataMinX || 86400000;

  const usedYMin = activeConfig.yMin !== "" ? Number(activeConfig.yMin) : Math.max(0, dataMinY - rangeYData * 0.1);
  const usedYMax = activeConfig.yMax !== "" ? Number(activeConfig.yMax) : dataMaxY + rangeYData * 0.1;
  const usedYStep = activeConfig.yStep !== "" ? Number(activeConfig.yStep) : (usedYMax - usedYMin) / 4;

  const usedXMin = activeConfig.xMin !== "" ? new Date(activeConfig.xMin + "T00:00:00").getTime() : dataMinX;
  const usedXMax = activeConfig.xMax !== "" ? new Date(activeConfig.xMax + "T00:00:00").getTime() : dataMaxX;
  const usedXStepMs = activeConfig.xStep !== "" ? Math.max(1, Number(activeConfig.xStep)) * 86400000 : rangeXData / 4;

  const getX = (dateMs: number) => paddingX + ((dateMs - usedXMin) / (usedXMax - usedXMin || 1)) * (width - paddingX * 2);
  const getY = (monto: number) => height - paddingY - ((monto - usedYMin) / (usedYMax - usedYMin || 1)) * (height - paddingY * 2);

  const yLines = [];
  if (usedYStep > 0) { for(let y = usedYMin; y <= usedYMax; y += usedYStep) yLines.push(y); }

  const xLines = [];
  if (usedXStepMs > 0) { for(let x = usedXMin; x <= usedXMax; x += usedXStepMs) xLines.push(x); }

  const pointsStr = data.map((d:any) => `${getX(d.dateMs)},${getY(d.monto)}`).join(" ");

  const handleChangeConfig = (e: any) => setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (onSaveConfig) {
      setIsSaving(true);
      await onSaveConfig(localConfig);
      setIsSaving(false);
      if (showGlobalMessage) showGlobalMessage("success", "Configuración Guardada", "El gráfico se ha calibrado y ya es visible para todos los fiduciantes.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col w-full relative bg-slate-900 overflow-hidden">
      {!simplified && (
        <div className="p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Evolución de Precios (USD)</h2>
              <p className="text-slate-500 mt-1">Análisis visual del mercado secundario de CDPs.</p>
            </div>
            <Button onClick={handleSave} isLoading={isSaving} icon={IconSave} className="!py-2 !px-4 text-sm whitespace-nowrap shadow-sm">Guardar Cambios</Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
               <IconTrendingUp className="w-5 h-5 text-slate-400" />
               <select name="filterYear" value={localConfig.filterYear} onChange={handleChangeConfig} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-violet-500">
                  {aniosDisponibles.map((a:any) => <option key={a} value={a}>{a}</option>)}
               </select>
            </div>
            
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
               <span className="font-bold text-slate-700">Eje Y (USD):</span>
               <input type="number" name="yMin" placeholder="Mín" value={localConfig.yMin} onChange={handleChangeConfig} className="w-16 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Valor Mínimo (USD)" />
               <input type="number" name="yMax" placeholder="Máx" value={localConfig.yMax} onChange={handleChangeConfig} className="w-16 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Valor Máximo (USD)" />
               <input type="number" name="yStep" placeholder="Salto" value={localConfig.yStep} onChange={handleChangeConfig} className="w-16 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Salto entre líneas (USD)" />
            </div>

            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-700">Eje X (Fechas):</span>
               <input type="date" name="xMin" value={localConfig.xMin} onChange={handleChangeConfig} className="w-[115px] border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Fecha Mínima" />
               <input type="date" name="xMax" value={localConfig.xMax} onChange={handleChangeConfig} className="w-[115px] border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Fecha Máxima" />
               <input type="number" name="xStep" placeholder="Días" value={localConfig.xStep} onChange={handleChangeConfig} className="w-16 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500" title="Intervalo de días en Eje X" />
            </div>
          </div>
        </div>
      )}

      {/* SVG Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden w-full h-full relative p-2">
         <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-full min-w-[500px]">
           
           <text x={width / 2} y={simplified ? 18 : 25} textAnchor="middle" className={`font-bold fill-slate-300 ${simplified ? 'text-[22px]' : 'text-[28px]'}`}>
              Precio de los CDP y fecha de operación
           </text>

           {yLines.map((val, idx) => {
               const y = getY(val);
               if(y < 0 || y > height) return null;
               return (
                   <g key={`y-${idx}`}>
                     <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#334155" strokeDasharray="4 4" />
                     <text x={paddingX - 10} y={y + 5} textAnchor="end" className="text-[16px] fill-slate-400 font-mono font-bold">${Math.round(val)}</text>
                   </g>
               )
           })}

           {xLines.map((val, idx) => {
               const x = getX(val);
               if(x < paddingX || x > width - paddingX) return null;
               const dateObj = new Date(val);
               const dateStr = simplified ? dateObj.getFullYear().toString() : formatDateForDisplay(dateObj.toISOString().split('T')[0]);
               return (
                   <g key={`x-${idx}`}>
                      <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#1e293b" />
                      <text 
                        x={x} 
                        y={height - (simplified ? 5 : 10)} 
                        textAnchor={simplified ? "middle" : "end"} 
                        className={`fill-slate-500 font-mono font-bold ${simplified ? 'text-[16px]' : 'text-[17px]'}`} 
                        transform={simplified ? "" : `rotate(-45 ${x} ${height - 15})`}
                      >
                        {dateStr}
                      </text>
                   </g>
               )
           })}

           <polyline points={pointsStr} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />

           {data.map((d:any, i:number) => {
               const cx = getX(d.dateMs);
               const cy = getY(d.monto);
               if (cx < 0 || cx > width || cy < 0 || cy > height) return null;
               return (
               <circle
                   key={i}
                   cx={cx}
                   cy={cy}
                   r={simplified ? "5" : "7"}
                   fill="#1e293b"
                   stroke="#a78bfa"
                   strokeWidth="3"
                   className="cursor-pointer transition-all duration-300 origin-center"
                   style={{ transformOrigin: `${cx}px ${cy}px` }}
                   onMouseEnter={(e) => {
                     e.currentTarget.setAttribute('r', '9');
                     e.currentTarget.setAttribute('fill', '#8b5cf6');
                     setHoveredPoint({ x: cx, y: cy, ...d });
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.setAttribute('r', simplified ? '5' : '7');
                     e.currentTarget.setAttribute('fill', '#1e293b');
                     setHoveredPoint(null);
                   }}
               />
               )
           })}

           {hoveredPoint && (
               <g transform={`translate(${hoveredPoint.x}, ${Math.max(65, hoveredPoint.y - 65)})`} className="pointer-events-none transition-all duration-100 ease-out">
                   <rect x="-95" y="-55" width="190" height="65" rx="8" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
                   <polygon points="-8,10 8,10 0,18" fill="#ffffff" />
                   <text x="0" y="-25" textAnchor="middle" fill="#0f172a" className="text-[20px] font-black">USD {hoveredPoint.monto.toLocaleString()}</text>
                   <text x="0" y="2" textAnchor="middle" fill="#64748b" className="text-[16px] font-mono font-bold">{hoveredPoint.fechaStr}</text>
               </g>
           )}
         </svg>
      </div>
    </div>
  );
}

// ==========================================
// VISTAS DE LA APLICACIÓN
// ==========================================

const LoginView = ({ users, setView, setCurrentUser, showGlobalMessage }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: any) => {
    e.preventDefault();
    const user = users.find((u: any) => u.email === email.toLowerCase() && u.password === password);
    if (user) { sessionStorage.setItem(SESSION_KEY, user.id); setCurrentUser(user); setView(user.isValidated ? "dashboard" : "validation"); } 
    else { showGlobalMessage("error", "Error de Autenticación", "Credenciales incorrectas."); }
  };
  const handleForgot = () => {
    if (!email) { showGlobalMessage("info", "Recuperar", "Ingresa tu correo primero."); return; }
    const user = users.find((u: any) => u.email === email.toLowerCase());
    if (user) { showGlobalMessage("success", "Enviado", `(Demo) Tu contraseña es: ${user.password}`); } 
    else { showGlobalMessage("error", "Error", "Cuenta no encontrada."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
            <IconBuilding className="w-8 h-8 text-violet-600" />
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow border-2 border-white"><IconCloud className="w-3 h-3" /></div>
          </div>
          <h1 className="font-bold text-slate-800 flex flex-row items-center justify-center gap-3">
            <span className="text-4xl tracking-tight">Mercado de CDP</span>
            <span className="text-lg text-violet-600 bg-violet-100 px-3 py-0.5 rounded-full font-black tracking-widest uppercase mt-1">v50</span>
          </h1>
          <p className="text-slate-500 mt-4 font-medium italic">&quot;Club de Campo Viñas en las Violetas&quot;</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <InputField icon={IconMail} label="Correo Electrónico" type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <InputField icon={IconLock} label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          <div className="flex justify-end"><button type="button" onClick={handleForgot} className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">¿Olvidaste tu contraseña?</button></div>
          
          <div className="flex flex-col gap-3 mt-4">
             <Button type="submit" className="w-full">Ingresar a mi cuenta</Button>
             <Button type="button" variant="outline" className="w-full" onClick={() => setView("guest_dashboard")}>Acceso Invitados</Button>
          </div>
        </form>
        <p className="mt-8 text-center text-slate-600 text-sm">¿No tienes cuenta? <button onClick={() => setView("register")} className="font-bold text-violet-600 hover:underline">Solicitar alta</button></p>
      </Card>
    </div>
  );
};

const RegisterView = ({ users, onRegister, setView, setCurrentUser, showGlobalMessage }: any) => {
  const [formData, setFormData] = useState({ nombres: "", apellidos: "", cuit: "", telefono: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); setIsLoading(true);
    const emailLower = formData.email.toLowerCase();
    if (users.some((u: any) => u.email === emailLower)) { showGlobalMessage("error", "Email duplicado", "Correo ya registrado."); setIsLoading(false); return; }
    
    const isFirstUser = users.length === 0;
    const newUser = { ...formData, id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, email: emailLower, correlativeId: users.length + 1, isAdmin: isFirstUser, isValidated: false, fechaRegistro: new Date().toISOString() };
    await onRegister(newUser);
    sessionStorage.setItem(SESSION_KEY, newUser.id);
    setCurrentUser(newUser);
    showGlobalMessage("success", "Registro Exitoso", "Tu cuenta ha sido creada.", () => setView("validation"));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-xl border-2 border-slate-200">
        <button onClick={() => setView("login")} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"><IconChevronRight className="w-4 h-4 rotate-180 mr-1" /> Volver al Login</button>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Solicitud de Alta</h2>
        <p className="text-slate-500 mb-8">Completa tus datos para ingresar al Mercado de CDP.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField icon={IconUser} label="Nombres" value={formData.nombres} onChange={(e: any) => setFormData({ ...formData, nombres: e.target.value })} required /><InputField icon={IconUser} label="Apellidos" value={formData.apellidos} onChange={(e: any) => setFormData({ ...formData, apellidos: e.target.value })} required /></div>
          <InputField icon={IconFileText} label="CUIT / CUIL" value={formData.cuit} onChange={(e: any) => setFormData({ ...formData, cuit: e.target.value })} required />
          <InputField icon={IconPhone} label="Teléfono (WhatsApp)" value={formData.telefono} onChange={(e: any) => setFormData({ ...formData, telefono: e.target.value })} required />
          <InputField icon={IconMail} label="Correo Electrónico" type="email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} required />
          <InputField icon={IconLock} label="Contraseña" type="password" value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} required />
          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>Registrarme</Button>
        </form>
      </Card>
    </div>
  );
};

const ValidationView = ({ user, cdps, onUpdate, setView, setCurrentUser }: any) => {
  const [formData, setFormData] = useState({ nombres: user.nombres, apellidos: user.apellidos, cuit: user.cuit, telefono: user.telefono });
  const [isLoading, setIsLoading] = useState(false);
  const currentRole = getUserRole(user, cdps);

  const handleSubmit = async (e: any) => { e.preventDefault(); setIsLoading(true); const updatedUser = { ...user, ...formData, isValidated: true }; await onUpdate(user.id, updatedUser); setCurrentUser(updatedUser); setView("dashboard"); setIsLoading(false); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-2xl mb-6 shadow-sm flex items-start gap-4">
          <IconAlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div><h4 className="font-bold text-amber-900">Validación Requerida</h4><p className="text-amber-800 text-sm mt-1">Antes de operar, es obligatorio confirmar que tus datos fiduciarios son correctos.</p></div>
        </div>
        <Card className="border-2 border-slate-200">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8 pb-8 border-b border-slate-100">
            <div><h2 className="text-2xl font-bold text-slate-800">Perfil Fiduciario</h2><p className="text-slate-500">Revisión de legajo digital</p></div>
            <div className="text-center md:text-right"><span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría Oficial</span><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${currentRole === ROLES.ADMIN ? "bg-violet-100 text-violet-700" : currentRole === ROLES.NO_FIDUCIANTE ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700"}`}>{currentRole === ROLES.ADMIN && <IconShield className="w-4 h-4" />}{currentRole}</span><div className="mt-2 text-xl font-black text-slate-800 tracking-tight">Socio Nº {formatId(user.correlativeId)}</div></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Nombres" value={formData.nombres} onChange={(e: any) => setFormData({ ...formData, nombres: e.target.value })} required /><InputField label="Apellidos" value={formData.apellidos} onChange={(e: any) => setFormData({ ...formData, apellidos: e.target.value })} required /></div>
            <InputField label="CUIT / CUIL" value={formData.cuit} onChange={(e: any) => setFormData({ ...formData, cuit: e.target.value })} required />
            <InputField label="Teléfono de Contacto" value={formData.telefono} onChange={(e: any) => setFormData({ ...formData, telefono: e.target.value })} required />
            <div className="pt-6"><Button type="submit" className="w-full" isLoading={isLoading} icon={IconCheckCircle}>Confirmo que mis datos son correctos</Button></div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// NUEVO: VISTA DEL DASHBOARD PARA INVITADOS
// ==========================================
const GuestDashboardView = ({ operaciones, ofertas, chartConfigData, setView, onSaveUserOffer, showGlobalMessage }: any) => {
  const [offerModalConfig, setOfferModalConfig] = useState<{isOpen: boolean, type: string}>({ isOpen: false, type: "COMPRA" });
  const ofertasOrdenadas = [...ofertas].sort((a, b) => Number(a.monto) - Number(b.monto));

  const handleVentaClick = () => {
    showGlobalMessage("info", "Acceso Restringido", "Para publicar ofertas de venta de CDPs en el mercado, debes registrarte y poseer un legajo de fiduciante validado.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1000px] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <IconUser className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Portal de Invitados</h1>
          </div>
          <button onClick={() => setView("login")} className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-semibold transition-colors">
            <span className="hidden sm:inline">Volver al Inicio</span> <IconLogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Mercado Activo de CDPs</h2>
          <p className="text-slate-500 mt-1">Visualización del estado del mercado y recepción de ofertas de compra externas.</p>
        </div>
        
        <Card className="p-6 bg-slate-100/50 border-2 border-slate-300 border-t-4 border-t-violet-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[1fr_1fr_180px] gap-4 lg:h-[520px]">
            
            {/* Cuadrante: Gráfico */}
            <div className="lg:col-span-2 lg:row-span-2 rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full bg-white flex flex-col">
               <MarketChart operaciones={operaciones} simplified={true} savedConfig={chartConfigData} />
            </div>

            {/* Cuadrante: Ofertas */}
            <div className="lg:col-span-1 lg:row-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[500px] lg:h-full">
               <h4 className="font-bold text-slate-800 mb-4 shrink-0 border-b border-slate-100 pb-2">CDPs Disponibles</h4>
               
               <div className="overflow-y-auto space-y-3 flex-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {ofertasOrdenadas.length > 0 ? (
                    ofertasOrdenadas.map((of: any) => (
                      <div key={of.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between min-h-[85px] gap-3">
                         <div className="flex justify-between items-start gap-2 w-full">
                           <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded uppercase tracking-widest border border-violet-200 whitespace-nowrap mt-0.5">Oferta Venta</span>
                           <span className="text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">CDP {of.cdpNumber}</span>
                         </div>
                         <div className="flex justify-between items-end gap-2 w-full">
                           <div className="flex items-baseline gap-1 text-slate-800 whitespace-nowrap">
                             <span className="text-[11px] font-black">U$S</span>
                             <span className="text-[22px] font-black leading-none">{Number(of.monto).toLocaleString()}</span>
                           </div>
                           <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase whitespace-nowrap text-right mb-0.5">
                              <IconClock className="w-3 h-3 shrink-0" /> Vence {formatDateForDisplay(of.vencimiento)}
                           </span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                       <IconTag className="w-8 h-8 text-slate-300 mb-2" />
                       <p className="text-slate-400 text-sm font-medium">No hay ofertas publicadas.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Cuadrante: Botón Compra (Funcional) */}
            <div className="lg:col-span-1 lg:row-span-1 h-full">
               <button onClick={() => setOfferModalConfig({ isOpen: true, type: "COMPRA" })} className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-3 bg-white border-2 border-violet-600 text-violet-700 hover:bg-violet-50 transition-colors shadow-sm rounded-2xl group cursor-pointer">
                 <IconShoppingCart className="w-10 h-10 text-violet-600 group-hover:scale-110 transition-transform" />
                 <span className="text-base font-bold text-center leading-tight">Hacer oferta de<br/>compra de CDP</span>
               </button>
            </div>

            {/* Cuadrante: Botón Venta (Bloqueado para Invitados) */}
            <div className="lg:col-span-1 lg:row-span-1 h-full">
               <button onClick={handleVentaClick} className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-3 bg-slate-200 text-slate-400 border border-slate-300 transition-colors rounded-2xl cursor-not-allowed shadow-inner">
                 <IconTag className="w-10 h-10 text-slate-400 opacity-70" />
                 <span className="text-base font-bold text-center leading-tight opacity-70">Hacer oferta de<br/>Venta de CDP</span>
               </button>
            </div>

          </div>
        </Card>
      </main>

      <UserOfferModal 
        isOpen={offerModalConfig.isOpen} 
        offerType={offerModalConfig.type} 
        user={null} 
        onClose={() => setOfferModalConfig({ isOpen: false, type: "COMPRA" })} 
        onSave={onSaveUserOffer} 
        showGlobalMessage={showGlobalMessage} 
      />
    </div>
  );
};


const DashboardView = ({ user, cdps, operaciones, ofertas, boveda, chartConfigData, setView, handleLogout, onSaveUserOffer, showGlobalMessage }: any) => {
  const misCdps = cdps.filter((c: any) => c.ownerId === user.id);
  const currentRole = getUserRole(user, cdps);
  const [selectedBovedaCdp, setSelectedBovedaCdp] = useState("");
  const [offerModalConfig, setOfferModalConfig] = useState<{isOpen: boolean, type: string}>({ isOpen: false, type: "COMPRA" });

  const bovedaDocsFiltered = selectedBovedaCdp ? boveda.filter((d:any) => String(d.cdpNumber) === String(selectedBovedaCdp)) : [];

  // Ordenar ofertas de menor a mayor monto
  const ofertasOrdenadas = [...ofertas].sort((a, b) => Number(a.monto) - Number(b.monto));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <IconBuilding className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Mi Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            {user.isAdmin || user.correlativeId === 1 ? (
              <Button variant="outline" className="!py-2 !px-4 !rounded-xl text-sm border-2 border-slate-300" icon={IconShield} onClick={() => setView("admin")}>
                Panel Admin
              </Button>
            ) : null}
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-semibold transition-colors">
              <IconLogOut className="w-5 h-5" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA (Mensaje, Credencial, Legajo) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="mb-2">
              <h2 className="text-3xl font-bold text-slate-800">Bienvenido, {user.nombres}</h2>
              <p className="text-slate-500 mt-1">Categoría Oficial: <span className="font-bold text-violet-600">{currentRole}</span></p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 p-8 text-white shadow-2xl shadow-violet-900/20 border border-white/10">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <IconCreditCard className="w-8 h-8 text-violet-300" />
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Socio Nº</span>
                    <span className="text-2xl font-black text-white">{formatId(user.correlativeId)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{user.nombres} {user.apellidos}</h3>
                  <p className="text-slate-400 font-mono tracking-widest text-sm">CUIT: {user.cuit}</p>
                </div>
              </div>
            </div>

            <Card className="p-6 border-2 border-slate-300 border-t-4 border-t-violet-500">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <IconUser className="w-5 h-5 text-violet-500" /> Legajo Digital
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Email</span>
                  <span className="font-semibold text-slate-800 text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Teléfono</span>
                  <span className="font-semibold text-slate-800 text-sm">{user.telefono}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 text-sm">Fecha Alta</span>
                  <span className="font-semibold text-slate-800 text-sm">{new Date(user.fechaRegistro).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA (Mercado, Bóveda, CDPs) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SECCIÓN 1: MERCADO ACTIVO */}
            <Card className="p-6 bg-slate-100/50 border-2 border-slate-300 border-t-4 border-t-violet-500">
              <div className="mb-6 border-b border-slate-200 pb-4">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <IconTrendingUp className="w-7 h-7 text-violet-600" /> Mercado Activo
                  </h3>
                  <p className="text-slate-600 mt-1 font-medium">Precios, Tendencias, Ofertas de Compra y Venta (Valores USD)</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[1fr_1fr_180px] gap-4 lg:h-[520px]">
                
                {/* Cuadrante: Gráfico */}
                <div className="lg:col-span-2 lg:row-span-2 rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full bg-white flex flex-col">
                   <MarketChart operaciones={operaciones} simplified={true} savedConfig={chartConfigData} />
                </div>

                {/* Cuadrante: Ofertas */}
                <div className="lg:col-span-1 lg:row-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[500px] lg:h-full">
                   <h4 className="font-bold text-slate-800 mb-4 shrink-0 border-b border-slate-100 pb-2">CDPs Disponibles para Venta</h4>
                   
                   {/* Scroll Window para las tarjetas de Ofertas */}
                   <div className="overflow-y-auto space-y-3 flex-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {ofertasOrdenadas.length > 0 ? (
                        ofertasOrdenadas.map((of: any) => (
                          <div key={of.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm hover:border-violet-400 transition-all flex flex-col justify-between group relative overflow-hidden min-h-[85px] gap-3">
                             
                             <div className="flex justify-between items-start gap-2 w-full">
                               <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded uppercase tracking-widest border border-violet-200 whitespace-nowrap mt-0.5">
                                 Oferta de Venta
                               </span>
                               
                               <span className="text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                                 CDP {of.cdpNumber}
                               </span>
                             </div>

                             <div className="flex justify-between items-end gap-2 w-full">
                               <div className="flex items-baseline gap-1 text-slate-800 whitespace-nowrap">
                                 <span className="text-[11px] font-black">U$S</span>
                                 <span className="text-[22px] font-black leading-none">{Number(of.monto).toLocaleString()}</span>
                               </div>
                               
                               <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase whitespace-nowrap text-right mb-0.5">
                                  <IconClock className="w-3 h-3 shrink-0" /> Vence {formatDateForDisplay(of.vencimiento)}
                               </span>
                             </div>

                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                           <IconTag className="w-8 h-8 text-slate-300 mb-2" />
                           <p className="text-slate-400 text-sm font-medium">No hay ofertas publicadas.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Cuadrante: Botón Compra */}
                <div className="lg:col-span-1 lg:row-span-1 h-full">
                   <button onClick={() => setOfferModalConfig({ isOpen: true, type: "COMPRA" })} className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-3 bg-white border-2 border-violet-600 text-violet-700 hover:bg-violet-50 transition-colors shadow-sm rounded-2xl group cursor-pointer">
                     <IconShoppingCart className="w-10 h-10 text-violet-600 group-hover:scale-110 transition-transform" />
                     <span className="text-base font-bold text-center leading-tight">Hacer oferta de<br/>compra de CDP</span>
                   </button>
                </div>

                {/* Cuadrante: Botón Venta */}
                <div className="lg:col-span-1 lg:row-span-1 h-full">
                   <button onClick={() => setOfferModalConfig({ isOpen: true, type: "VENTA" })} className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-md shadow-violet-500/30 rounded-2xl group cursor-pointer">
                     <IconTag className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                     <span className="text-base font-bold text-center leading-tight">Hacer oferta de<br/>Venta de CDP</span>
                   </button>
                </div>

              </div>
            </Card>

            {/* SECCIÓN 2: BÓVEDA DOCUMENTOS */}
            <Card className="p-6 border-2 border-slate-300 border-t-4 border-t-blue-500">
              <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <IconFolder className="w-6 h-6 text-blue-600" /> Bóveda de Documentos
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Accede a las copias digitales de tus certificados legales.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Selecciona un activo de tu propiedad:</label>
                   <select 
                     className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700" 
                     value={selectedBovedaCdp} 
                     onChange={(e) => setSelectedBovedaCdp(e.target.value)}
                   >
                     <option value="">-- Mis CDPs Asignados --</option>
                     {misCdps.map((c:any) => <option key={c.number} value={c.number}>Certificado Nº {c.number}</option>)}
                   </select>
                 </div>
              </div>

              {selectedBovedaCdp ? (
                bovedaDocsFiltered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                     {bovedaDocsFiltered.map((doc:any) => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-2xl transition-all group shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                                 <IconFileText className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-700 text-sm line-clamp-2">{doc.titulo}</span>
                           </div>
                           <IconExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </a>
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in">
                    <IconFileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm font-medium">No hay documentos vinculados a este CDP todavía.</p>
                  </div>
                )
              ) : (
                 <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                    Utiliza el menú superior para ver tus documentos.
                 </div>
              )}

              {/* Cuadro informativo de Bóveda */}
              <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
                 <IconInfo className="w-6 h-6 shrink-0 mt-0.5" />
                 <div className="text-sm leading-relaxed font-medium">
                   <p>El fiduciante asocia el archivo de la foto de la primer página del CDP.</p>
                   <p className="mt-1">En caso de querer ver más documentación en la bóveda de documentos, por favor solicitarlo al Whatsapp 2614722618.</p>
                 </div>
              </div>

            </Card>

            {/* SECCIÓN 3: MIS CDPS ASIGNADOS */}
            <Card className="p-6 border-2 border-slate-300 border-t-4 border-t-violet-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <IconGrid className="w-6 h-6 text-violet-500" /> Mis CDPs Asignados
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Certificados de Participacion a tu nombre.</p>
                </div>
                <span className="bg-violet-100 text-violet-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  Total: {misCdps.length}
                </span>
              </div>

              {misCdps.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {misCdps.map((cdp: any) => (
                    <div key={cdp.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center group hover:border-violet-400 hover:shadow-md transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Activo</p>
                      <p className="font-bold text-slate-800 text-lg">CDP {cdp.number}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <IconFileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No tienes CDPs asignados actualmente.</p>
                </div>
              )}
            </Card>

          </div>
        </div>
      </main>

      {/* MODAL DE COMPRA/VENTA PARA USUARIOS */}
      <UserOfferModal 
        isOpen={offerModalConfig.isOpen} 
        offerType={offerModalConfig.type} 
        user={user} 
        onClose={() => setOfferModalConfig({ isOpen: false, type: "COMPRA" })} 
        onSave={onSaveUserOffer} 
        showGlobalMessage={showGlobalMessage} 
      />

    </div>
  );
};

const AdminView = ({ users, cdps, operaciones, ofertas, boveda, solicitudes, chartConfigData, setView, currentUser, setCurrentUser, onUpdateUser, onDeleteUser, onSaveOperacion, onDeleteOperacion, onSaveOferta, onDeleteOferta, onSaveBoveda, onDeleteBoveda, onDeleteSolicitud, onSaveChartConfig, showGlobalMessage }: any) => {
  const [activeTab, setActiveTab] = useState("fiduciantes"); 
  const [editingUser, setEditingUser] = useState<any>(undefined);
  const [editingOperacion, setEditingOperacion] = useState<any>(undefined);
  const [editingOferta, setEditingOferta] = useState<any>(undefined);
  const [editingBoveda, setEditingBoveda] = useState<any>(undefined);

  const nextOfertaNum = ofertas.length > 0 ? Math.max(...ofertas.map((o:any) => Number(o.numero) || 0)) + 1 : 1;

  const handleDeleteUserRequest = (userToDelete: any) => {
    if (userToDelete.id === currentUser.id) { showGlobalMessage("error", "Acción Denegada", "No puedes eliminar tu propia cuenta de administrador."); return; }
    showGlobalMessage("confirm", "Eliminar Fiduciante", `¿Estás seguro de que deseas eliminar a ${userToDelete.nombres}?`, async () => { await onDeleteUser(userToDelete.id); showGlobalMessage("success", "Usuario Eliminado", "El registro fue borrado exitosamente."); }, null, "Sí, Eliminar");
  };

  const handleDeleteOperacionRequest = (operacion: any) => {
    showGlobalMessage("confirm", "Eliminar Operación", `¿Estás seguro de que deseas eliminar la operación #${operacion.numero}?`, async () => { await onDeleteOperacion(operacion.id); showGlobalMessage("success", "Operación Eliminada", "El registro fue borrado exitosamente."); }, null, "Sí, Eliminar");
  };

  const handleDeleteOfertaRequest = (oferta: any) => {
    showGlobalMessage("confirm", "Eliminar Oferta", `¿Estás seguro de que deseas eliminar la oferta #${oferta.numero}?`, async () => { await onDeleteOferta(oferta.id); showGlobalMessage("success", "Oferta Eliminada", "La oferta fue removida del mercado."); }, null, "Sí, Eliminar");
  };

  const handleDeleteBovedaRequest = (docInfo: any) => {
    showGlobalMessage("confirm", "Desvincular Documento", `¿Estás seguro de que deseas borrar este documento del CDP #${docInfo.cdpNumber}?`, async () => { await onDeleteBoveda(docInfo.id); showGlobalMessage("success", "Documento Borrado", "El enlace se desvinculó de la bóveda."); }, null, "Sí, Borrar");
  };

  const handleDeleteSolicitudRequest = (solicitud: any) => {
    showGlobalMessage("confirm", "Eliminar Solicitud", `¿Eliminar la solicitud de ${solicitud.nombres} ${solicitud.apellidos}?`, async () => { await onDeleteSolicitud(solicitud.id); showGlobalMessage("success", "Solicitud Eliminada", "La solicitud fue borrada del sistema."); }, null, "Sí, Eliminar");
  };

  const getUserName = (id: string) => {
    if (id === "base_owner_sergio") return "Sergio Gabriel Argumedo Rosello";
    const user = users.find((u: any) => u.id === id);
    return user ? `${user.nombres} ${user.apellidos}` : "Usuario Desconocido";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center relative"><IconSettings className="w-5 h-5 text-violet-400" /><div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900" title="En vivo"></div></div>
            <h1 className="text-xl font-bold hidden sm:block">Administración General</h1>
          </div>
          <Button variant="secondary" className="!py-2 !px-4 !rounded-xl text-sm border border-slate-700" onClick={() => setView("dashboard")}>Volver al Dashboard</Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8 border-b border-slate-200 pb-4">
          <button onClick={() => setActiveTab("fiduciantes")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "fiduciantes" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconUser className="w-4 h-4" /> Fiduciantes</button>
          <button onClick={() => setActiveTab("cdps")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "cdps" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconGrid className="w-4 h-4" /> Mapa CDPs</button>
          <button onClick={() => setActiveTab("operaciones")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "operaciones" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconList className="w-4 h-4" /> Registro Operaciones</button>
          <button onClick={() => setActiveTab("ofertas")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "ofertas" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconTag className="w-4 h-4" /> Ofertas Venta</button>
          <button onClick={() => setActiveTab("solicitudes")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "solicitudes" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconMail className="w-4 h-4" /> Solicitudes Usuarios {solicitudes.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{solicitudes.length}</span>}</button>
          
          <button onClick={() => setActiveTab("boveda")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "boveda" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconFolder className="w-4 h-4" /> Bóveda Documentos</button>
          <button onClick={() => setActiveTab("grafico")} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 ${activeTab === "grafico" ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"}`}><IconTrendingUp className="w-4 h-4" /> Gráfico Mercado</button>
        </div>

        {activeTab === "fiduciantes" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex justify-between items-end">
              <div><h2 className="text-2xl font-bold text-slate-800">Directorio de Socios</h2></div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-semibold text-slate-600">Total: {users.length}</div>
            </div>
            <Card className="!p-0 overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider"><th className="p-4 font-semibold">ID</th><th className="p-4 font-semibold">Fiduciante</th><th className="p-4 font-semibold">Categoría Oficial</th><th className="p-4 font-semibold">Contacto</th><th className="p-4 font-semibold text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u: any) => {
                      const uRole = getUserRole(u, cdps);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-middle"><span className="font-mono font-bold text-slate-600">{formatId(u.correlativeId)}</span></td>
                          <td className="p-4 align-middle"><p className="font-bold text-slate-800">{u.nombres} {u.apellidos}</p><p className="text-sm text-slate-500 font-mono mt-0.5">CUIT: {u.cuit}</p></td>
                          <td className="p-4 align-middle"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${uRole === ROLES.ADMIN ? "bg-violet-100 text-violet-700" : uRole === ROLES.NO_FIDUCIANTE ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700"}`}>{uRole}</span></td>
                          <td className="p-4 align-middle"><p className="text-sm font-medium text-slate-700">{u.email}</p><p className="text-sm text-slate-500 mt-0.5">{u.telefono}</p></td>
                          <td className="p-4 align-middle text-right space-x-2">
                            <button onClick={() => setEditingUser(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><IconEdit className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteUserRequest(u)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "cdps" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-800">Mapa Global de Activos</h2></div>
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl mb-6 flex items-start gap-4 shadow-sm">
               <IconInfo className="w-6 h-6 shrink-0 mt-0.5" />
               <div><h4 className="font-bold">Asignación Dinámica Activada</h4><p className="text-sm mt-1 leading-relaxed">El sistema lee el <b>Registro de Operaciones</b> cronológicamente y actualiza de forma automática a los nuevos propietarios.</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: TOTAL_CDPS }, (_, i) => i + 1).map(num => {
                const cdpInfo = cdps.find((c: any) => c.number === num);
                const currentOwnerId = cdpInfo ? cdpInfo.ownerId : "";
                const ownerName = getUserName(currentOwnerId);
                const isBaseOwner = currentOwnerId === "base_owner_sergio" || ownerName.toLowerCase().includes("argumedo");
                return (
                  <div key={num} className={`bg-white p-4 rounded-2xl border transition-all shadow-sm flex flex-col gap-3 ${isBaseOwner ? "border-slate-200" : "border-violet-300 bg-violet-50/40"}`}>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2"><span className="font-black text-slate-800 text-sm">CDP Número {num}</span><IconFileText className={`w-4 h-4 ${isBaseOwner ? "text-slate-300" : "text-violet-500"}`} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Propietario Actual:</label><div className="text-sm font-bold text-slate-700 truncate" title={ownerName}>{ownerName}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "operaciones" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div><h2 className="text-2xl font-bold text-slate-800">Historial de Transacciones</h2></div>
              <Button onClick={() => setEditingOperacion(null)} icon={IconList} className="whitespace-nowrap">+ Nueva Operación</Button>
            </div>
            <Card className="!p-0 overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider"><th className="p-4 font-semibold">Nº Oper.</th><th className="p-4 font-semibold">Fecha</th><th className="p-4 font-semibold">Nº CDP</th><th className="p-4 font-semibold">Vendedor</th><th className="p-4 font-semibold">Comprador</th><th className="p-4 font-semibold text-right">Monto (USD)</th><th className="p-4 font-semibold text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {operaciones.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No hay operaciones registradas aún.</td></tr> : operaciones.map((op: any) => (
                        <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-middle"><span className="font-bold text-slate-800">#{op.numero}</span></td>
                          <td className="p-4 align-middle text-sm text-slate-600 font-medium">{formatDateForDisplay(op.fecha)}</td>
                          <td className="p-4 align-middle"><span className="inline-flex items-center px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold">CDP {op.cdpNumber}</span></td>
                          <td className="p-4 align-middle text-sm font-semibold text-red-600">{getUserName(op.vendedorId)}</td>
                          <td className="p-4 align-middle text-sm font-semibold text-green-600">{getUserName(op.compradorId)}</td>
                          <td className="p-4 align-middle text-right font-bold text-slate-800">USD {Number(op.monto).toLocaleString()}</td>
                          <td className="p-4 align-middle text-right space-x-2">
                            <button onClick={() => setEditingOperacion(op)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><IconEdit className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteOperacionRequest(op)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "ofertas" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div><h2 className="text-2xl font-bold text-slate-800">Ofertas de Venta</h2></div>
              <Button onClick={() => setEditingOferta(null)} icon={IconTag} className="whitespace-nowrap">+ Nueva Oferta</Button>
            </div>
            <Card className="!p-0 overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider"><th className="p-4 font-semibold">Nº Oferta</th><th className="p-4 font-semibold">Publicada</th><th className="p-4 font-semibold">Nº CDP</th><th className="p-4 font-semibold">Vendedor</th><th className="p-4 font-semibold">Vencimiento</th><th className="p-4 font-semibold text-right">Monto (USD)</th><th className="p-4 font-semibold text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {ofertas.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No hay ofertas de venta activas.</td></tr> : ofertas.map((of: any) => (
                        <tr key={of.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-middle"><span className="font-bold text-slate-800">#{of.numero}</span></td>
                          <td className="p-4 align-middle text-sm text-slate-600">{formatDateForDisplay(of.fecha)}</td>
                          <td className="p-4 align-middle"><span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">CDP {of.cdpNumber}</span></td>
                          <td className="p-4 align-middle text-sm font-semibold text-slate-700">{getUserName(of.vendedorId)}</td>
                          <td className="p-4 align-middle text-sm text-red-500 font-medium">{formatDateForDisplay(of.vencimiento)}</td>
                          <td className="p-4 align-middle text-right font-bold text-slate-800">USD {Number(of.monto).toLocaleString()}</td>
                          <td className="p-4 align-middle text-right space-x-2">
                            <button onClick={() => setEditingOferta(of)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><IconEdit className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteOfertaRequest(of)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* NUEVA PESTAÑA: SOLICITUDES DE USUARIOS */}
        {activeTab === "solicitudes" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Bandeja de Solicitudes</h2>
                <p className="text-slate-500 mt-1">Ofertas de compra y venta enviadas por los fiduciantes.</p>
              </div>
            </div>
            <Card className="!p-0 overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Fecha</th>
                      <th className="p-4 font-semibold">Tipo</th>
                      <th className="p-4 font-semibold">Fiduciante</th>
                      <th className="p-4 font-semibold">Contacto</th>
                      <th className="p-4 font-semibold text-right">Monto</th>
                      <th className="p-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudes.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No hay solicitudes pendientes en este momento.</td></tr>
                    ) : (
                      solicitudes.map((sol: any) => (
                        <tr key={sol.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-middle text-sm font-medium text-slate-600">
                            {new Date(sol.fechaSolicitud).toLocaleDateString()}
                          </td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-widest uppercase ${sol.tipo === 'COMPRA' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                              {sol.tipo}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <p className="font-bold text-slate-800">{sol.nombres} {sol.apellidos}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">CUIT: {sol.cuit}</p>
                          </td>
                          <td className="p-4 align-middle">
                            <p className="text-sm font-medium text-slate-700">{sol.email}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{sol.telefono}</p>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <p className="font-black text-slate-800 text-lg">U$S {Number(sol.monto).toLocaleString()}</p>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <button onClick={() => handleDeleteSolicitudRequest(sol)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Borrar Solicitud">
                              <IconTrash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "boveda" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div><h2 className="text-2xl font-bold text-slate-800">Bóveda de Documentos</h2></div>
              <Button onClick={() => setEditingBoveda(null)} icon={IconFolder} className="whitespace-nowrap">+ Cargar Documento</Button>
            </div>
            <Card className="!p-0 overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider"><th className="p-4 font-semibold">Nº CDP</th><th className="p-4 font-semibold">Título del Documento</th><th className="p-4 font-semibold">Enlace (URL)</th><th className="p-4 font-semibold text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {boveda.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">La bóveda de documentos está vacía.</td></tr> : boveda.map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 align-middle"><span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">CDP {doc.cdpNumber}</span></td>
                          <td className="p-4 align-middle text-sm font-bold text-slate-800">{doc.titulo}</td>
                          <td className="p-4 align-middle"><a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1">Abrir Archivo <IconChevronRight className="w-3 h-3" /></a></td>
                          <td className="p-4 align-middle text-right space-x-2">
                            <button onClick={() => setEditingBoveda(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><IconEdit className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteBovedaRequest(doc)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "grafico" && <MarketChart operaciones={operaciones} savedConfig={chartConfigData} onSaveConfig={onSaveChartConfig} showGlobalMessage={showGlobalMessage} />}

      </main>

      {editingUser && <AdminEditModal user={editingUser} onClose={() => setEditingUser(undefined)} onUpdate={(id: string, data: any) => { onUpdateUser(id, data); if (id === currentUser.id) { setCurrentUser(data); if (!data.isAdmin) setView("dashboard"); } }} showGlobalMessage={showGlobalMessage} />}
      {editingOperacion !== undefined && <OperacionModal operacion={editingOperacion} users={users} onClose={() => setEditingOperacion(undefined)} onSave={onSaveOperacion} showGlobalMessage={showGlobalMessage} />}
      {editingOferta !== undefined && <OfertaModal oferta={editingOferta} users={users} cdps={cdps} nextOfertaNum={nextOfertaNum} onClose={() => setEditingOferta(undefined)} onSave={onSaveOferta} showGlobalMessage={showGlobalMessage} />}
      {editingBoveda !== undefined && <BovedaModal bovedaItem={editingBoveda} onClose={() => setEditingBoveda(undefined)} onSave={onSaveBoveda} showGlobalMessage={showGlobalMessage} />}
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL APP
// ==========================================

const MercadoApp = () => {
  const [currentView, setCurrentView] = useState("login");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [computedCdps, setComputedCdps] = useState<any[]>([]);
  const [operaciones, setOperaciones] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [boveda, setBoveda] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [chartConfigData, setChartConfigData] = useState<any>(null);
  
  const [isDbReady, setIsDbReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: "info", title: "", message: "", onConfirm: null, onCancel: null, confirmText: "Aceptar", cancelText: "Cancelar" });

  useEffect(() => {
    if (!firebaseConfig) return;
    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        setDbError("Error de Autenticación con Firebase.");
        setIsInitializing(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => setFirebaseUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseConfig || !firebaseUser) return;
    
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'fiduciantes');
    const uUnsubscribe = onSnapshot(usersRef, (snapshot: any) => {
      setUsers(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      setIsDbReady(true);
      setDbError(null);
    }, () => { setDbError("Error de permisos."); setIsInitializing(false); });

    const operacionesRef = collection(db, 'artifacts', appId, 'public', 'data', 'operaciones');
    const oUnsubscribe = onSnapshot(operacionesRef, (snapshot: any) => {
      const ops = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      ops.sort((a: any, b: any) => {
          const dateDiff = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          return dateDiff === 0 ? Number(b.numero) - Number(a.numero) : dateDiff;
      });
      setOperaciones(ops);
    });

    const ofertasRef = collection(db, 'artifacts', appId, 'public', 'data', 'ofertas');
    const ofUnsubscribe = onSnapshot(ofertasRef, (snapshot: any) => {
      const ofs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      ofs.sort((a: any, b: any) => Number(b.numero) - Number(a.numero));
      setOfertas(ofs);
    });

    const bovedaRef = collection(db, 'artifacts', appId, 'public', 'data', 'boveda');
    const bovUnsubscribe = onSnapshot(bovedaRef, (snapshot: any) => {
      const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setBoveda(docs);
    });

    const solicitudesRef = collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_ofertas');
    const solUnsubscribe = onSnapshot(solicitudesRef, (snapshot: any) => {
      const sols = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      sols.sort((a: any, b: any) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
      setSolicitudes(sols);
    });

    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'marketChart');
    const cUnsubscribe = onSnapshot(configRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setChartConfigData(docSnap.data());
      }
    });

    return () => { uUnsubscribe(); oUnsubscribe(); ofUnsubscribe(); bovUnsubscribe(); solUnsubscribe(); cUnsubscribe(); };
  }, [firebaseUser]);

  useEffect(() => {
    if (users.length === 0) return;
    let baseOwnerId = "base_owner_sergio";
    const sergio = users.find(u => u.nombres?.toLowerCase().includes("sergio") && u.apellidos?.toLowerCase().includes("argumedo"));
    if (sergio) baseOwnerId = sergio.id;

    let ownershipMap: Record<number, string> = {};
    for (let i = 1; i <= TOTAL_CDPS; i++) ownershipMap[i] = baseOwnerId;

    const chronologicalOps = [...operaciones].sort((a, b) => {
        const dateDiff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        return dateDiff === 0 ? Number(a.numero) - Number(b.numero) : dateDiff;
    });

    chronologicalOps.forEach(op => {
        const cdpNum = Number(op.cdpNumber);
        if (cdpNum >= 1 && cdpNum <= TOTAL_CDPS && op.compradorId) ownershipMap[cdpNum] = op.compradorId;
    });

    setComputedCdps(Object.keys(ownershipMap).map(numStr => ({ id: `cdp_${numStr}`, number: Number(numStr), ownerId: ownershipMap[Number(numStr)] })));
  }, [users, operaciones]);

  useEffect(() => {
    if (isDbReady && isInitializing) {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const user = users.find((u: any) => u.id === sessionId);
        if (user) {
          setCurrentUser(user);
          setCurrentView(user.isValidated ? "dashboard" : "validation");
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setIsInitializing(false);
    }
  }, [isDbReady, users, isInitializing]);

  const handleRegisterUser = async (newUser: any) => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fiduciantes', newUser.id), newUser); } catch (e) {} };
  const handleUpdateUser = async (id: string, data: any) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fiduciantes', id), data); } catch (e) {} };
  const handleDeleteUser = async (id: string) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fiduciantes', id)); } catch (e) {} };

  const handleSaveOperacion = async (data: any) => { try { const id = data.id || `op_${Date.now()}`; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'operaciones', id), { ...data, id, updatedAt: new Date().toISOString() }); } catch (e) {} };
  const handleDeleteOperacion = async (id: string) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'operaciones', id)); } catch (e) {} };

  const handleSaveOferta = async (data: any) => { try { const id = data.id || `of_${Date.now()}`; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ofertas', id), { ...data, id, updatedAt: new Date().toISOString() }); } catch (e) {} };
  const handleDeleteOferta = async (id: string) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ofertas', id)); } catch (e) {} };

  const handleSaveBoveda = async (data: any) => { try { const id = data.id || `doc_${Date.now()}`; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boveda', id), { ...data, id, updatedAt: new Date().toISOString() }); } catch (e) {} };
  const handleDeleteBoveda = async (id: string) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boveda', id)); } catch (e) {} };

  const handleSaveUserOffer = async (data: any) => { 
    try { 
      const id = `solicitud_${Date.now()}`; 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'solicitudes_ofertas', id), { 
        ...data, 
        id, 
        userId: currentUser ? currentUser.id : 'GUEST', // Registramos como GUEST si no hay usuario logueado
        fechaSolicitud: new Date().toISOString(),
        estado: 'PENDIENTE'
      }); 
    } catch (e) { console.error(e); } 
  };
  
  const handleDeleteSolicitud = async (id: string) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'solicitudes_ofertas', id)); } catch (e) {} };

  const handleSaveChartConfig = async (configData: any) => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'marketChart'), configData); } catch (e) { console.error(e); } };

  const showGlobalMessage = (type: string, title: string, message: string, onConfirmCallback: any = null, onCancelCallback: any = null, confirmText = "Aceptar") => {
    setModalConfig({ isOpen: true, type, title, message, confirmText, cancelText: "Cancelar", onConfirm: () => { setModalConfig((prev: any) => ({ ...prev, isOpen: false })); if (onConfirmCallback) onConfirmCallback(); }, onCancel: () => { setModalConfig((prev: any) => ({ ...prev, isOpen: false })); if (onCancelCallback) onCancelCallback(); } });
  };

  const handleLogout = () => { showGlobalMessage("confirm", "Cerrar Sesión", "¿Estás seguro de que deseas salir de tu cuenta?", () => { sessionStorage.removeItem(SESSION_KEY); setCurrentUser(null); setCurrentView("login"); }); };

  if (!firebaseConfig) return <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}><h2 style={{ color: '#d97706', fontSize: '1.5rem', fontWeight: 'bold' }}>¡Casi listo!</h2></div>;
  if (dbError) return <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}><h2 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 'bold' }}>Error de conexión</h2><button onClick={() => window.location.reload()}>Reintentar</button></div>;
  if (isInitializing || !isDbReady) return <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}><div><div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem', color: '#7c3aed' }}>Mercado de CDP</div><p style={{ fontSize: '0.875rem' }}>Conectando de forma segura con la Nube...</p></div></div>;

  return (
    <React.Fragment>
      {currentView === "login" && <LoginView users={users} setView={setCurrentView} setCurrentUser={setCurrentUser} showGlobalMessage={showGlobalMessage} />}
      {currentView === "register" && <RegisterView users={users} onRegister={handleRegisterUser} setView={setCurrentView} setCurrentUser={setCurrentUser} showGlobalMessage={showGlobalMessage} />}
      {currentView === "validation" && <ValidationView user={currentUser} cdps={computedCdps} onUpdate={handleUpdateUser} setView={setCurrentView} setCurrentUser={setCurrentUser} showGlobalMessage={showGlobalMessage} />}
      
      {/* NUEVA VISTA PARA INVITADOS */}
      {currentView === "guest_dashboard" && <GuestDashboardView operaciones={operaciones} ofertas={ofertas} chartConfigData={chartConfigData} setView={setCurrentView} onSaveUserOffer={handleSaveUserOffer} showGlobalMessage={showGlobalMessage} />}

      {currentView === "dashboard" && <DashboardView user={currentUser} cdps={computedCdps} operaciones={operaciones} ofertas={ofertas} boveda={boveda} chartConfigData={chartConfigData} setView={setCurrentView} handleLogout={handleLogout} onSaveUserOffer={handleSaveUserOffer} showGlobalMessage={showGlobalMessage} />}
      
      {currentView === "admin" && <AdminView users={users} cdps={computedCdps} operaciones={operaciones} ofertas={ofertas} boveda={boveda} solicitudes={solicitudes} chartConfigData={chartConfigData} setView={setCurrentView} currentUser={currentUser} setCurrentUser={setCurrentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onSaveOperacion={handleSaveOperacion} onDeleteOperacion={handleDeleteOperacion} onSaveOferta={handleSaveOferta} onDeleteOferta={handleDeleteOferta} onSaveBoveda={handleSaveBoveda} onDeleteBoveda={handleDeleteBoveda} onDeleteSolicitud={handleDeleteSolicitud} onSaveChartConfig={handleSaveChartConfig} showGlobalMessage={showGlobalMessage} />}
      <GlobalModal {...modalConfig} />
    </React.Fragment>
  );
};

export default MercadoApp;
