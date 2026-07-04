import { notFound } from "next/navigation";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { ProfileFlow } from "@/components/giftmind/profile-flow";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const profile = await prisma.personProfile.findFirst({
    where: { id, userId: session!.user.id },
  });
  if (!profile) notFound();

  return (
    <ProfileFlow
      profileId={profile.id}
      initial={{
        name: profile.name,
        relationship: profile.relationship,
        gender: profile.gender ?? "",
        ageRange: profile.ageRange,
        interests: profile.interests ?? [],
        birthday: profile.birthday ? profile.birthday.toISOString().slice(0, 10) : "",
        freeSaturday: profile.freeSaturday,
        talksAbout: profile.talksAbout ?? "",
        homeStyle: profile.homeStyle,
        spendingStyle: profile.spendingStyle,
        tooMuchOf: profile.tooMuchOf ?? "",
        wantsButNeverBought: profile.wantsButNeverBought ?? "",
        lovedPastGifts: profile.lovedPastGifts ?? "",
        hobbies: profile.hobbies ?? "",
        lifeChanges: profile.lifeChanges ?? "",
        neverBuyThemselves: profile.neverBuyThemselves ?? "",
        aesthetic: profile.aesthetic,
        notes: profile.notes ?? "",
      }}
    />
  );
}
