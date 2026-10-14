import { redirect } from "next/navigation";

import { getInitialAlbumYear } from "@/lib/album/server/queries";
import { HomeError } from "@/lib/home/server/errors";

export default async function ReadingAlbumIndexPage() {
  try {
    const year = await getInitialAlbumYear();
    redirect(`/mi-album/${year}`);
  } catch (error) {
    if (error instanceof HomeError && error.kind === "unauthenticated") {
      redirect("/iniciar-sesion");
    }
    throw error;
  }
}
