import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('imagelabs-theme');
            if (stored === 'dark' || stored === 'light')
                return stored;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        localStorage.setItem('imagelabs-theme', theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return (_jsx(Button, { variant: "ghost", size: "icon", onClick: toggleTheme, "aria-label": `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`, className: "text-muted-foreground hover:text-foreground", children: theme === 'light' ? _jsx(Moon, { className: "size-5" }) : _jsx(Sun, { className: "size-5" }) }));
}
//# sourceMappingURL=theme-toggle.js.map