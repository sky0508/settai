'use client';

import React, { useState, useRef } from 'react';

type Props = {
    message?: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
};

export default function DeleteButton({ message = '本当に削除してもよろしいですか？\nこの操作は元に戻せません。', children, className, style, title }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    return (
        <>
            <button
                type="button"
                className={className}
                style={style}
                title={title}
                onClick={(e) => {
                    e.preventDefault();
                    formRef.current = e.currentTarget.form;
                    setIsOpen(true);
                }}
            >
                {children}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-red-500 text-[28px]">delete_forever</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-navy mb-2">確認</h3>
                            <p className="text-sm text-navy/70 whitespace-pre-wrap">{message}</p>
                        </div>

                        <div className="flex border-t border-navy/5">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-3.5 text-sm font-semibold text-navy/70 hover:bg-navy/5 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    if (formRef.current) {
                                        formRef.current.requestSubmit();
                                    }
                                }}
                                className="flex-1 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-l border-navy/5"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
