import React, { useState } from "react";
import { PAGINATION_ORDER } from "../../enums/common";
import { ResponseLpListDto } from "../types/lp";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useGetInfiniteLpList from "../hooks/queries/useGetInfiniteLpList";
import { useThrottle } from '../hooks/useThrottle';

function formatDate(date: string | Date) {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

// SkeletonCard 컴포넌트 추가
const SkeletonCard = () => (
  <div className="bg-gray-700 animate-pulse rounded aspect-square w-full" />
);

const Home = () => {
    const [order, setOrder] = useState<PAGINATION_ORDER>(PAGINATION_ORDER.DESC);
    const search = useOutletContext<string>() || "";
    const { accessToken } = useAuth();
    const navigate = useNavigate();

    const { data, isFetching, hasNextPage, fetchNextPage, isError, isLoading } = useGetInfiniteLpList(50, search, order);
    const loader = React.useRef<HTMLDivElement | null>(null);

    // 무한 스크롤 Intersection Observer
    const handleIntersect = useThrottle(() => {
        if (!hasNextPage || isFetching) return;
        fetchNextPage();
    }, 3000); // 3초 동안 한 번만 실행되도록 설정

    React.useEffect(() => {
        if (!hasNextPage || isFetching) return;
        const observer = new window.IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    handleIntersect();
                }
            },
            { threshold: 1 }
        );
        if (loader.current) observer.observe(loader.current);
        return () => {
            if (loader.current) observer.unobserve(loader.current);
        };
    }, [hasNextPage, isFetching, handleIntersect]);

    // LP 리스트 펼치기
    const lpList = data?.pages.flatMap(page => page.data.data) ?? [];
    
    type LpItem = ResponseLpListDto["data"]["data"][number];

    const handleCardClick = (lpId: number) => {
        if (!accessToken) {
            alert("로그인이 필요한 서비스입니다. 로그인을 해주세요!"); 
            navigate("/login");
        } else {
            navigate(`/lp/${lpId}`);
        }
    };

    return (
        <main className="flex-1 bg-black p-8 transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl text-[#ff3399] font-bold">LP 리스트</h1>
                <div className="flex gap-2">
                    <button
                        className={`p-2 rounded font-semibold transition
                            ${order === PAGINATION_ORDER.DESC
                                ? 'bg-[#ff3399] text-white shadow-lg ring-2 ring-[#ff3399]'
                                : 'bg-gray-700 text-white hover:bg-[#ff3399]/80 hover:text-white'}
                        `}
                        onClick={() => setOrder(PAGINATION_ORDER.DESC)}
                    >
                        최신순
                    </button>
                    <button
                        className={`p-2 rounded font-semibold transition
                            ${order === PAGINATION_ORDER.ASC
                                ? 'bg-[#ff3399] text-white shadow-lg ring-2 ring-[#ff3399]'
                                : 'bg-gray-700 text-white hover:bg-[#ff3399]/80 hover:text-white'}
                        `}
                        onClick={() => setOrder(PAGINATION_ORDER.ASC)}
                    >
                        오래된 순
                    </button>
                </div>
            </div>
            {isLoading && <div className="text-white">Loading...</div>}
            {isError && <div className="text-white">Error</div>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  : <>
                      {lpList.map((lp: LpItem) => (
                        <div
                          key={lp.id}
                          className="bg-[#222] rounded shadow overflow-hidden flex flex-col relative group transition-transform duration-200 cursor-pointer hover:scale-105"
                          onClick={() => handleCardClick(lp.id)}
                        >
                          {lp.thumbnail ? (
                            <img
                              src={lp.thumbnail}
                              alt={lp.title}
                              className="w-full aspect-square object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-700 flex items-center justify-center text-white">No Image</div>
                          )}
                          {/* 호버 */}
                          <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-70 flex flex-col justify-end transition-opacity duration-200">
                            <div className="p-4 text-white">
                              <div className="font-bold text-lg mb-1 truncate">{lp.title}</div>
                              <div className="text-xs text-gray-300 mb-1">{formatDate(lp.updatedAt || lp.ceatedAt)}</div>
                              <div className="flex items-center gap-1 text-sm">
                                <span>👍</span>
                                <span>{lp.likes?.length ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* 무한 스크롤 추가 로딩 시 하단에만 스켈레톤 */}
                      {isFetching && hasNextPage &&
                        Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={`fetching-${i}`} />)
                      }
                    </>
                }
            </div>
            {/* 무한 스크롤 트리거 */}
            <div ref={loader} />
        </main>
    );
};

export default Home;
