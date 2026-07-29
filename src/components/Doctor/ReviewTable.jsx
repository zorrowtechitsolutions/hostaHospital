// src/components/Reviews/ReviewTable.jsx
import { useState, useEffect } from "react";
import { Star, User, Calendar, ThumbsUp, MessageCircle } from "lucide-react";
import { Badge, Loader } from "../ui";
import { useGetReviewsQuery } from "../../../app/service/review";
import { socket } from '../../socket/socket';
import { registerRatingEvents, unregisterRatingEvents } from '../../socket/ratingEvents';
import { registerReviewEvents, unregisterReviewEvents } from '../../socket/reviewEvents';
import { getHospitalId } from "../../utils/auth";


const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-800">
                {review.name || review.patientName || review.userName || "Anonymous User"}
              </h4>
              {review.isVerified && (
                <Badge variant="success" className="text-xs">
                  Verified Patient
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-600 ml-1">
                ({review.rating}/5)
              </span>
            </div>

            {review.comment && (
              <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                {review.comment}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(review.createdAt || review.date)}</span>
              </div>
              {review.appointmentType && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{review.appointmentType}</span>
                </div>
              )}
              {review.helpfulCount > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{review.helpfulCount} people found this helpful</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewTable = ({
  doctorId,
  doctorName,
  isHospitalReview = false,
}) => {
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");
  const [eventsRegistered, setEventsRegistered] = useState(false);


const {
  data: reviewsResponse,
  isLoading,
  error,
  refetch,
} = useGetReviewsQuery(
  isHospitalReview
    ? { hospitalId: getHospitalId() }
    : { doctorId }
);

  console.log("API Response:", reviewsResponse);
console.log("Reviews Array:", reviewsResponse?.data);

const reviews = reviewsResponse?.data || [];
const totalReviews = reviews.length;


  const registerEvents = (refetchFn) => {
    registerRatingEvents({
      onRatingRegistered: async (data) => {
        await refetchFn();
      },
      onRatingUpdated: async (data) => {
        await refetchFn();
      }
    });

    registerReviewEvents({
      onReviewRegistered: async (data) => {
        await refetchFn();
      },
      onReviewUpdated: async (data) => {
        await refetchFn();
      }
    });
  };

  useEffect(() => {
    registerEvents(refetch);
    setEventsRegistered(true);

    return () => {
      unregisterRatingEvents();
      unregisterReviewEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerEvents(refetch);
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.floor(r.rating) === star).length
  }));

  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />;
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <Star className="h-5 w-5 text-gray-300" />
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          } else {
            return <Star key={index} className="h-5 w-5 text-gray-300" />;
          }
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader centered text="Loading reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-red-500">Error loading reviews</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-blue-500 hover:underline text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Rating</p>
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-800">
                {averageRating.toFixed(1)}
              </span>
              <div>
                {renderRatingStars(averageRating)}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="col-span-3">
            <p className="text-sm text-gray-600 mb-2">Rating Distribution</p>
            <div className="space-y-1.5">
              {ratingDistribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-6">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ 
                        width: totalReviews > 0 
                          ? `${(count / totalReviews) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-600">Filter by rating:</label>
            <div className="flex gap-1">
              {["all", "5", "4", "3", "2", "1"].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filterRating === rating
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {rating === "all" ? "All" : `${rating}★`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalReviews > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id || index} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">
            {isHospitalReview
              ? "No hospital reviews yet"
              : "No reviews yet for this doctor"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Reviews from patients will appear here once they share their experience
          </p>
        </div>
      )}

      {totalReviews > 0 && (
        <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
          Showing {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          {filterRating !== "all" && ` with ${filterRating} star rating`}
        </div>
      )}
    </div>
  );
};

export default ReviewTable;