from adzuna import search_multiple, Job


def print_job(job: Job) -> None:
    print(f"\n{'=' * 60}")
    print(f"Title:    {job.title}")
    print(f"Company:  {job.company}")
    print(f"Location: {job.location}")
    if job.salary_min or job.salary_max:
        lo = f"${job.salary_min:,.0f}" if job.salary_min else "?"
        hi = f"${job.salary_max:,.0f}" if job.salary_max else "?"
        predicted = " (estimated)" if job.salary_is_predicted else ""
        print(f"Salary:   {lo} – {hi}{predicted}")
    if job.contract_time:
        print(f"Type:     {job.contract_time}")
    if job.category:
        print(f"Category: {job.category}")
    print(f"Posted:   {job.created}")
    print(f"URL:      {job.url}")
    print(f"\n{job.description[:300]}{'...' if len(job.description) > 300 else ''}")


def main():
    titles = [
        "software engineer",
        "data engineer",
    ]
    location = ["San Francisco", "Atlanta"]

    print(f"Searching Adzuna for {titles} in '{location}'...\n")

    jobs = search_multiple(
        titles=titles,
        where=location,
        country="us",
        results_per_page=5,
        max_pages=1,
    )

    if not jobs:
        print("No jobs found.")
        return

    print(f"\nFound {len(jobs)} unique job(s):")
    for job in jobs:
        print_job(job)
        # print(job.description)

    print(f"\n{'=' * 60}")
    print(f"Total: {len(jobs)} unique jobs")

if __name__ == "__main__":
    main()
