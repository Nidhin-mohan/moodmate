import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onResponseError } from "./index";

const errorFor = (status: number, url: string) =>
  new AxiosError("fail", "ERR", { url, headers: new AxiosHeaders() }, undefined, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: { url, headers: new AxiosHeaders() },
  });

describe("onResponseError", () => {
  const assign = vi.fn();

  beforeEach(() => {
    localStorage.setItem("token", "t");
    localStorage.setItem("user", "{}");
    vi.stubGlobal("location", { ...window.location, assign, href: "http://localhost/dashboard" });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("on 401 from a protected call: clears token and user, sends to /login", async () => {
    await expect(onResponseError(errorFor(401, "/mood"))).rejects.toBeInstanceOf(AxiosError);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("on 401 from /auth/login (wrong password): leaves the page alone", async () => {
    await expect(onResponseError(errorFor(401, "/auth/login"))).rejects.toBeInstanceOf(AxiosError);
    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe("t");
  });

  it("on 403: does not log the user out", async () => {
    await expect(onResponseError(errorFor(403, "/admin/users"))).rejects.toBeInstanceOf(AxiosError);
    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe("t");
  });
});
