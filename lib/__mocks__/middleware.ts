const requireAuth = jest.fn();

module.exports = {
  requireAuth,
  withAuth: (handler: (req: any, auth: any) => Promise<any>) =>
    async (request: any) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth);
    },
  withAuthAndParams: (handler: (req: any, auth: any, params: any) => Promise<any>) =>
    async (request: any, { params }: { params: Promise<any> }) => {
      const auth = requireAuth(request);
      if (auth && 'status' in auth) return auth;
      return handler(request, auth, await params);
    },
};
