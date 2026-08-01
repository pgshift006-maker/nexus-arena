import CreatePost from '@/components/feed/CreatePost'
import FeedList from '@/components/feed/FeedList'

export default function FeedPage() {
  return (
    <div className="max-w-[470px] mx-auto sm:px-4 py-4 sm:py-6">
      <CreatePost />
      <FeedList />
    </div>
  )
}
