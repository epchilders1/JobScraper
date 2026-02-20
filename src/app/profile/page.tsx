import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import ProfilePage from "../pages/ProfilePage/ProfilePage";

export default async function Profile(){
  const session = await auth();
  const user = await api.user.getProfile({ id: session!.user.id })

  const handleUpsertUserPreferences = async (data: any) => {
    "use server"

    if (data.resume instanceof File) {
      try {
        const formData = new FormData();
        formData.append("resume", data.resume);
        const flaskResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/parse_resume`, {
          method: "POST",
          body: formData,
        });
        if (!flaskResponse.ok) throw new Error(`Flask error: ${flaskResponse.statusText}`);
        const { rawText, skills, embedding } = await flaskResponse.json() as {
          rawText: string;
          skills: string[];
          embedding: number[];
        };
        await api.user.upsertResume({
          rawText,
          skills,
          embedding,
          fileName: (data.resume as File).name,
        });
      } catch (err) {
        console.error("Failed to parse resume:", err);
        return;
      }
    }
    if(data.resume === null) {
      await api.user.upsertResume({
        rawText: "",
        skills: [],
        embedding: [],
        fileName: "",
      });
    }

    const { resume: _resume, ...prefs } = data;
    await api.user.upsertUserPreferences(prefs);
  }

  return(
    <ProfilePage user={user} handleUpsertUserPreferences={handleUpsertUserPreferences}/>
  );
}