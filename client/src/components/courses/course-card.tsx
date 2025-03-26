import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    tag?: string | null;
    tagColor?: string | null;
    rating: number;
    reviewCount: number;
    duration: string;
    deleted?: boolean;
    deletedAt?: Date | null;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  // Helper to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="h-4 w-4 text-yellow-400" />
          <Star className="absolute top-0 left-0 h-4 w-4 text-yellow-400 fill-yellow-400 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-yellow-400" />
      );
    }
    
    return stars;
  };

  // Get the corresponding badge color class
  const getBadgeVariant = () => {
    switch (course.tagColor) {
      case 'primary':
        return "bg-primary-100 text-primary-800";
      case 'secondary':
        return "bg-secondary-100 text-secondary-800";
      case 'green':
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Card className="overflow-hidden transition duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <div className="relative pb-[56.25%]">
        <img
          src={course.imageUrl}
          alt={course.title}
          className="absolute h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-slate-900">{course.title}</h3>
          {course.tag && (
            <Badge variant="outline" className={getBadgeVariant()}>
              {course.tag}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{course.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-slate-700">{course.rating.toFixed(1)}</span>
            <div className="ml-1 flex">
              {renderStars(course.rating)}
            </div>
            <span className="ml-1 text-sm text-slate-500">({course.reviewCount})</span>
          </div>
          <span className="text-sm font-medium text-slate-700">{course.duration}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/course/${course.id}`}>
          <Button className="w-full">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
