export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span>製作者: <a href="https://x.com/kojima920" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 hover:underline">@kojima920</a></span>
            <span>問い合わせ: <a href="mailto:mk19830920@gmail.com" className="text-orange-600 hover:text-orange-700 hover:underline">mk19830920@gmail.com</a></span>
            <span>寄付先: <span className="font-mono">PayPayID: kojima1459</span></span>
          </div>
          <div className="text-gray-500">
            © 2025 クマップ - Bear Sighting Information Map
          </div>
        </div>
      </div>
    </footer>
  );
}
