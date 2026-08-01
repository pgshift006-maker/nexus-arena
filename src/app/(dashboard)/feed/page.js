import CreatePost from '@/components/feed/CreatePost'
import FeedList from '@/components/feed/FeedList'

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <CreatePost />
      <FeedList />
    </div>
  )
}
