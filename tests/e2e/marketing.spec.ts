import { test,expect } from "@playwright/test";
test("marketing page exposes the product and authentication paths",async({page})=>{await page.goto("/");await expect(page.getByRole("heading",{name:"Every Moment Deserves a Frame."})).toBeVisible();await expect(page.getByRole("link",{name:/Create event/i}).first()).toHaveAttribute("href","/register")});
