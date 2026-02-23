import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import JobsPage from "../pages/JobsPage/JobsPage";

export default async function Jobs(){
    const session = await auth();
    if (!session) return null;
    const user = await api.user.getProfile({ id: session!.user.id })
    
    return(
        <HydrateClient>
            <JobsPage user={user} />
        </HydrateClient>
    );
}
