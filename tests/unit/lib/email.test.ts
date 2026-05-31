const mockSend = jest.fn().mockResolvedValue({});
const mockMailtrapClient = jest.fn().mockImplementation(() => ({ send: mockSend }));

jest.mock("mailtrap", () => ({
  MailtrapClient: mockMailtrapClient,
}));

describe("lib/email.ts", () => {
  const RESET_URL = "https://app.example.com/reset?token=abc123";
  const RECIPIENT = "user@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("sendPasswordResetEmail", () => {
    it("calls MailtrapClient.send with correct to, subject, and reset URL", async () => {
      process.env.MAILTRAP_TOKEN = "test-token";
      const { sendPasswordResetEmail } = await import("@/lib/email");

      await sendPasswordResetEmail(RECIPIENT, RESET_URL);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toEqual([{ email: RECIPIENT }]);
      expect(call.subject).toMatch(/password/i);
      expect(call.html).toContain(RESET_URL);
      expect(call.text).toContain(RESET_URL);
    });

    it("throws a clear configuration error when MAILTRAP_TOKEN is missing", async () => {
      delete process.env.MAILTRAP_TOKEN;
      const { sendPasswordResetEmail } = await import("@/lib/email");

      await expect(sendPasswordResetEmail(RECIPIENT, RESET_URL)).rejects.toThrow(
        /MAILTRAP_TOKEN/
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sends with category password-reset", async () => {
      process.env.MAILTRAP_TOKEN = "test-token";
      const { sendPasswordResetEmail } = await import("@/lib/email");

      await sendPasswordResetEmail(RECIPIENT, RESET_URL);

      const call = mockSend.mock.calls[0][0];
      expect(call.category).toBe("password-reset");
    });

    it.each([
      ["custom@example.com", "custom@example.com"],
      [undefined, "noreply@session-combat.app"],
    ])(
      "uses correct sender when MAILTRAP_FROM_EMAIL is %s",
      async (envVal, expected) => {
        process.env.MAILTRAP_TOKEN = "test-token";
        if (envVal) process.env.MAILTRAP_FROM_EMAIL = envVal;
        else delete process.env.MAILTRAP_FROM_EMAIL;

        const { sendPasswordResetEmail } = await import("@/lib/email");
        await sendPasswordResetEmail(RECIPIENT, RESET_URL);

        const call = mockSend.mock.calls[0][0];
        expect(call.from.email).toBe(expected);
      }
    );
  });
});
