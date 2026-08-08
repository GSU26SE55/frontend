import { Loader2 } from "lucide-react";
import { useNotificationGroupMembers } from "@/features/admin/hooks/notification/useNotificationGroups";

interface Props {
  groupId: string;
  /** Actual recipient count for the group — used to call out the truncated portion when the list is long. */
  memberCount: number;
}

/** Enough to skim a normal-sized group without pulling thousands of rows for a quick peek. */
const PEEK_PAGE_SIZE = 50;

/**
 * List of people in a group, shown right below the group selector in the broadcast form.
 *
 * <b>Why this is needed:</b> previously the group selector only showed a name and a count. An admin
 * about to send to "All Customers" had no way to know who those 2 people were without opening
 * another screen — and sending a notification can't be undone.
 *
 * <b>Why it only loads when opened:</b> the component only renders when the user clicks to open it,
 * so <c>useNotificationGroupMembers</c> only calls the API at that point too. Pre-loading all 5
 * groups would be 5 wasted API calls.
 *
 * <b>Why inactive people still show up:</b> they're still in the group but do NOT receive
 * notifications — that's exactly why the row count here can be higher than the recipient count next
 * to the group name. Hiding them would leave the admin confused about why the two numbers don't
 * match, with no way to clean it up.
 */
export default function GroupMemberPeek({ groupId, memberCount }: Props) {
  const { data, isLoading, isError } = useNotificationGroupMembers(groupId, {
    pageNumber: 1,
    pageSize: PEEK_PAGE_SIZE,
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-1.5 px-2.5 pb-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Loading list…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="px-2.5 pb-2 text-xs text-destructive">
        Couldn't load the group's member list.
      </p>
    );
  }

  const members = data?.items ?? [];

  if (members.length === 0) {
    return (
      <p className="px-2.5 pb-2 text-xs text-muted-foreground italic">
        This group has no members yet.
      </p>
    );
  }

  const inactiveCount = members.filter((m) => !m.isActive).length;
  const total = data?.totalItems ?? members.length;
  const hidden = total - members.length;

  return (
    <div className="border-t border-border/60 px-2.5 py-1.5">
      <ul className="max-h-44 space-y-0.5 overflow-y-auto">
        {members.map((m) => (
          <li
            key={m.userId}
            className={`flex items-baseline gap-1.5 text-xs ${
              m.isActive ? "" : "opacity-50"
            }`}
          >
            <span className="truncate font-medium">{m.fullName}</span>
            <span className="truncate text-muted-foreground">{m.email}</span>
            {!m.isActive && (
              <span className="shrink-0 text-muted-foreground">· inactive</span>
            )}
          </li>
        ))}
      </ul>

      {inactiveCount > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {inactiveCount} inactive members will <b>not</b> receive notifications
          — that's why the count next to the group name ({memberCount}) is lower
          than the number of rows here.
        </p>
      )}

      {hidden > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          {hidden} more not shown here — open the "Notification recipient
          groups" screen to see them all.
        </p>
      )}
    </div>
  );
}
