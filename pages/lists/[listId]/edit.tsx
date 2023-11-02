import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { FaUserPlus } from "react-icons/fa6";
import { fetchApiData } from "helpers/fetchApiData";
import HubContributorsPageLayout from "layouts/hub-contributors";
import Text from "components/atoms/Typography/text";
import ToggleSwitch from "components/atoms/ToggleSwitch/toggle-switch";
import Button from "components/atoms/Button/button";
import TextInput from "components/atoms/TextInput/text-input";
import useSupabaseAuth from "lib/hooks/useSupabaseAuth";
import { useToast } from "lib/hooks/useToast";

// TODO: put into shared utilities once https://github.com/open-sauced/app/pull/2016 is merged
function isListId(listId: string) {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  return regex.test(listId);
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { listId } = ctx.params as { listId: string };
  const supabase = createPagesServerClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const bearerToken = session ? session.access_token : "";
  const userId = Number(session?.user.user_metadata.sub);

  if (!isListId(listId)) {
    return {
      notFound: true,
    };
  }

  const { data: list, error } = await fetchApiData<DBList>({
    path: `lists/${listId}`,
    bearerToken,
    // TODO: remove this in another PR for cleaning up fetchApiData
    pathValidator: () => true,
  });

  // Only the list owner should be allowed to add contributors
  if (error?.status === 404 || (list && list.user_id !== userId)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      list,
    },
  };
};

interface EditListPageProps {
  list: DBList;
}

interface UpdateListPayload {
  name: string;
  is_public: boolean;
  contributors: number[];
}

export default function EditListPage({ list }: EditListPageProps) {
  const [isPublic, setIsPublic] = useState(list.is_public);
  const { sessionToken } = useSupabaseAuth();
  const { toast } = useToast();

  async function updateList(payload: UpdateListPayload) {
    const { data, error } = await fetchApiData<DBList>({
      path: `lists/${list.id}`,
      method: "PATCH",
      body: payload,
      bearerToken: sessionToken!,
      // TODO: remove this in another PR for cleaning up fetchApiData
      pathValidator: () => true,
    });

    return { data, error };
  }

  return (
    <HubContributorsPageLayout>
      <div className="grid place-content-center info-container container w-full min-h-[6.25rem] px-4 mt-10 mb-16">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.target as HTMLFormElement;
            const listUpdates = {
              name: form["list_name"].value,
              is_public: form["is_public"].checked,
              contributors: [],
            } satisfies UpdateListPayload;

            const { data, error } = await updateList(listUpdates);

            if (!error) {
              toast({ description: "List updated successfully!", variant: "success" });
            } else {
              toast({ description: "Error updating list. Please try again", variant: "danger" });
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex justify-between align-center items-center">
            <h1 className="text-2xl text-light-slate-12">Edit List</h1>
            <Button variant="primary" type="submit">
              Save changes
            </Button>
          </div>
          <p className="text-light-slate-11 pb-4 border-b border-solid border-light-slate-6">
            A list is a collection of contributors that you and your team can get insights for.
          </p>
          <label className="flex flex-col w-full text-light-slate-12 gap-4">
            List Name
            <TextInput name="list_name" defaultValue={list.name} />
          </label>
          <div className="flex flex-col flex-wrap gap-4 pb-4 pt-4 border-t border-b border-solid border-light-slate-6">
            <Text className="text-light-slate-12">Page Visibility</Text>
            <div className="flex items-center">
              <UserGroupIcon className="w-6 h-6 text-light-slate-9 mr-2" />
              <Text className="text-light-slate-11">
                <span id="make-public-explainer">Make this page publicly visible</span>
              </Text>
            </div>
            <div className="flex ml-2 !border-red-900 items-center">
              <Text className="!text-orange-600 pr-2 hidden md:block">Make Public</Text>
              <ToggleSwitch
                ariaLabelledBy="make-public-explainer"
                name="is_public"
                checked={isPublic}
                handleToggle={() => setIsPublic((isPublic: boolean) => !isPublic)}
              />
            </div>
          </div>
          <div className="flex justify-between flex-wrap pb-4 border-b border-solid border-light-slate-6">
            <p>Add Contributors</p>
            <Button
              variant="outline"
              href={`/lists/${list.id}/add-contributors`}
              className="flex gap-2.5 py-1 items-center pl-3 pr-7 cursor-pointer"
            >
              <FaUserPlus size={22} />
              <span>Add new contributors</span>
            </Button>
          </div>
        </form>
      </div>
    </HubContributorsPageLayout>
  );
}
