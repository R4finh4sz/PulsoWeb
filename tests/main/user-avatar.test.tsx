import { render, screen, waitFor } from "@testing-library/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { profileApi } from "@/integrations/profile/api";
import { queryWrapper, teacher } from "../helpers";

jest.mock("@/integrations/profile/api", () => ({ profileApi: { photo: jest.fn() } }));

test("avatar usa iniciais sem foto e atualiza após invalidar a foto do perfil", async () => {
  jest.mocked(profileApi.photo).mockResolvedValue(undefined);
  const { client, wrapper } = queryWrapper();
  const view = render(<UserAvatar user={teacher} className="rounded-full" />, { wrapper });
  await waitFor(() => expect(client.getQueryData(["profile-photo", teacher.id])).toBeNull());
  expect(screen.queryByAltText("Foto de perfil")).not.toBeInTheDocument();
  expect(view.container).toHaveTextContent("PT");
  jest.mocked(profileApi.photo).mockResolvedValue(new Blob(["photo"], { type: "image/png" }));
  await client.invalidateQueries({ queryKey: ["profile-photo", teacher.id] });
  expect(await screen.findByAltText("Foto de perfil")).toHaveAttribute("src", "blob:test");
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
});
