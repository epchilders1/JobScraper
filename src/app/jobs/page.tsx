import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import JobsPage from "../pages/JobsPage/JobsPage";

export default async function Jobs(){
    const session = await auth();
    if (!session) return null;
    return(
        <HydrateClient>
            <JobsPage />
        </HydrateClient>
    );
}
