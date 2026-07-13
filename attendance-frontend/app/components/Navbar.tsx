export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white px-8 py-4 flex gap-6">
      <a href="/" className="hover:text-gray-300">Dashboard</a>
      <a href="/attendance" className="hover:text-gray-300">Attendance</a>
      <a href="/employees" className="hover:text-gray-300">Employees</a>
    </nav>
  );
}