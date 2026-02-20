'use client';
import './JobCard.css';
import { useState } from 'react';
import { api } from '~/trpc/react';

interface JobCardProps {
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        salaryMin?: number | null;
        salaryMax?: number | null;
        matchScore: number;
        description?: string | null;
        url?: string | null;
        star: boolean;
    };
}

export default function JobCard(props: JobCardProps) {
    const { job } = props;
    const [starred, setStarred] = useState(job.star);
    const [expanded, setExpanded] = useState(false);
    console.log(job);
    const toggleStar = api.user.toggleStar.useMutation();

    const handleStar = () => {
        const newStar = !starred;
        setStarred(newStar);
        toggleStar.mutate(
            { jobMatchId: job.id, star: newStar },
            { onError: () => setStarred(!newStar) }
        );
    };

    const formatSalary = (amount: number | null | undefined) => {
        if (amount == null) return null;
        if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
        if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
        return `$${amount}`;
    };

    const salaryStr =
        job.salaryMin ?? job.salaryMax
            ? `${formatSalary(job.salaryMin) ?? '?'} – ${formatSalary(job.salaryMax) ?? '?'}`
            : null;

    const scoreLabel =
        job.matchScore <= 1
            ? `${Math.round(job.matchScore * 100)}%`
            : `${Math.round(job.matchScore)}%`;

    const isLongDesc = (job.description?.length ?? 0) > 180;

    return (
        <div className="mock-card">
            <div className="mock-card-inner">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="text-left">
                        <div className="mb-1 text-sm font-semibold text-text-primary">{job.title}</div>
                        <div className="text-xs text-text-muted">
                            {job.company} · {job.location}
                            {salaryStr ? ` · ${salaryStr}` : ''}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            className={`star-btn${starred ? ' star-btn--active' : ''}`}
                            onClick={handleStar}
                            aria-label={starred ? 'Unstar job' : 'Star job'}
                        >
                            ★
                        </button>
                        <div className="match-badge">{scoreLabel}</div>
                    </div>
                </div>

                {/* Description */}
                {job.description && (
                    <div className="card-desc-wrap">
                        <p className={`card-desc${expanded ? '' : ' card-desc--collapsed'}`}>
                            {job.description}
                        </p>
                        {isLongDesc && (
                            <button
                                className="card-expand-btn"
                                onClick={() => setExpanded((v) => !v)}
                            >
                                {expanded ? 'Show less ↑' : 'Show more ↓'}
                            </button>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-end">
                    {job.url && (
                        <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="skill-chip shrink-0 no-underline hover:brightness-125 transition-all"
                        >
                            View Job →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
