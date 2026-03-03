import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean)

  return (
    <nav className="flex items-center text-sm text-gray-500">
      <Link to="/" className="hover:text-gray-900 font-medium">
        Home
      </Link>

      {paths.map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");
        const isLast = index === paths.length - 1;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight size={16} className="mx-2" />
            {isLast ? (
              <span className="text-blue-700 font-semibold capitalize">
                {path.replace("-", " ")}
              </span>
            ) : (
              <Link
                to={href}
                className="hover:text-gray-900 font-medium capitalize"
              >
                {path.replace("-", " ")}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
