'use client';

import React, { useState, useRef, useEffect } from 'react';

type Option = {
    value: string;
    label: string;
    searchStr: string; // 正規化検索用（オプション。なければlabelを正規化して検索）
};

type Props = {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    allowFreeText?: boolean;
};

// 全角半角・ひらがなカタカナ・大文字小文字の正規化
export const normalize = (str: string) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0));
};

export default function Combobox({ options, value, onChange, placeholder = '選択してください', className = '', allowFreeText = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [q, setQ] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOpt = options.find((o) => o.value === value);

    useEffect(() => {
        if (selectedOpt) {
            setQ(selectedOpt.label);
        } else {
            setQ(value || '');
        }
    }, [selectedOpt, value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (selectedOpt) setQ(selectedOpt.label);
                else if (!allowFreeText) setQ('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedOpt, allowFreeText]);

    const normQ = normalize(q);
    const filteredOptions = normQ
        ? options.filter((o) => {
            const target = o.searchStr || normalize(o.label);
            return target.includes(normQ);
        })
        : options;

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <input
                type="text"
                value={q}
                placeholder={placeholder}
                onFocus={() => {
                    setIsOpen(true);
                    setQ('');
                }}
                onChange={(e) => {
                    const val = e.target.value;
                    setQ(val);
                    if (!isOpen) setIsOpen(true);
                    if (allowFreeText) {
                        onChange(val); // 自由入力の場合は即座に反映
                    } else {
                        onChange(''); // 自由入力不可の場合は選択解除
                    }
                }}
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />

            {/* Dropdown chevron */}
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-navy/30 pointer-events-none text-[20px]">
                expand_more
            </span>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-navy/10 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-navy/40 text-center">見つかりませんでした</div>
                    ) : (
                        filteredOptions.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-navy/5 transition-colors ${o.value === value ? 'bg-gold/10 text-gold-dark font-bold' : 'text-navy'}`}
                                onClick={() => {
                                    onChange(o.value);
                                    setQ(o.label);
                                    setIsOpen(false);
                                }}
                            >
                                {o.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
