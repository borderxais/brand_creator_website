import Image from 'next/image';
import Link from 'next/link';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  link: string | null;
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
}

export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
          {item.imageUrl && (
            <div className="relative h-48">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            {item.description && (
              <p className="mt-2 text-gray-600">{item.description}</p>
            )}
            {item.link && (
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-500"
              >
                View Project
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
