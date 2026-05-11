let _app: any;
let _appLoaded = false;
let _appError: string | null = null;

export default async function handler(req: any, res: any) {
  if (!_appLoaded) {
    _appLoaded = true;
    try {
      const mod = await import("../artifacts/api-server/src/app");
      _app = mod.default;
    } catch (err) {
      _appError = err instanceof Error ? err.message : String(err);
    }
  }

  if (_appError) {
    res.status(500).json({ error: "Module load failed", message: _appError });
    return;
  }
  return _app(req, res);
}
