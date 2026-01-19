import React from 'react';
import { Card } from '../atoms/Card';

export const StatCard = ({ title, amount, type = 'neutral' }) => {
    const borderColors = {
        success: "border-l-finance-success",
        danger: "border-l-finance-danger",
        accent: "border-l-finance-accent",
        neutral: "border-l-slate-400"
    };

    return (
        <Card className={`border-l-4 ${borderColors[type] || borderColors.neutral}`}>
            <p className="text-slate-500 text-sm font-medium uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-finance-primary mt-1">{amount}</h3>
        </Card>
    );
};
