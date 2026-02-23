'use client';
import './JobsPage.css';
import AnimatedList from './AnimatedList';
import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import JobCard from '~/app/_components/JobCard/JobCard';
import {toast,Toaster} from 'react-hot-toast';

interface JobsPageProps {
    user?: any;
}

export default function JobsPage(props: JobsPageProps) {
    const { user } = props;
    console.log(user);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [starredOnly, setStarredOnly] = useState(false);
    const [adzunaPage, setAdzunaPage] = useState(0);
    const [hasMoreAdzuna, setHasMoreAdzuna] = useState(true);

    const utils = api.useUtils();

    useEffect(() => {
        void import('ldrs').then(({ ring }) => ring.register());
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data: jobs = [], isLoading } = api.user.getJobMatches.useQuery({
        search: debouncedSearch,
        starredOnly,
        minMatchScore: user?.preferences?.minMatchScore ?? undefined,
    });

    const loadMore = api.user.loadMoreJobs.useMutation({
        onSuccess: ({ count }) => {
            if (count === 0) {
                setHasMoreAdzuna(false);
                toast.error('No more jobs found from Adzuna. Try adjusting your preferences or search term?');
            } else {
                setAdzunaPage((p) => p + 1);
                void utils.user.getJobMatches.invalidate();
            }
        },
    });

    return (
        <div className="jobs-page">
            <Toaster position="top-left" toastOptions={{ style: { background: '#1A1A24', color: '#F0F0FF', border: '1px solid #2A2A3A' } }} />
            <div className="jobs-content">
                <div className="jobs-header">
                    <h1 className="jobs-title">Matched Jobs</h1>
                    <div className="jobs-controls">
                        <input
                            className="jobs-search"
                            placeholder="Search by job title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            className={`jobs-filter-btn${starredOnly ? ' jobs-filter-btn--active' : ''}`}
                            onClick={() => setStarredOnly((v) => !v)}
                        >
                            ★ Starred
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="jobs-status">
                        <l-ring size="36" stroke="3" speed="2" color="#6C63FF" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="jobs-status">
                        {starredOnly
                            ? 'No starred jobs yet.'
                            : 'No jobs loaded yet — click "Load more jobs" to fetch your first batch.'}
                    </div>
                ) : (
                    <div className="jobs-list">
                        <p className="text-sm text-gray-500">{jobs.length} listings found</p>
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}

                {!starredOnly && !isLoading && (
                    <div className="jobs-load-more">
                        <button
                            className="jobs-load-more-btn"
                            onClick={() => loadMore.mutate({ page: adzunaPage + 1 })}
                            disabled={loadMore.isPending}
                        >
                            {loadMore.isPending ? (
                                <l-ring size="20" stroke="2.5" speed="2" color="#9999BB" />
                            ) : (
                                'Load more jobs'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
