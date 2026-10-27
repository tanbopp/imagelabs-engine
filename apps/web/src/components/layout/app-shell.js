import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Header } from './header';
import { Footer } from './footer';
export function AppShell({ children }) {
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-background text-foreground", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-10", children: children }), _jsx(Footer, {})] }));
}
//# sourceMappingURL=app-shell.js.map