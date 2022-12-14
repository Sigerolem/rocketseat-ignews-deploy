import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import styles from "./posts.module.scss";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
}

interface PostsProps {
  posts: Post[]
}

export default function Posts({posts}: PostsProps) {
  const session = useSession()
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.slug} href={`/posts/${!session.data ? `preview/${post.slug}` : post.slug}`}>
              <a >
                <time>{post.updatedAt}</time>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </a>
            </Link>
          ))}
          
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps() {
  const prismic = getPrismicClient()

  const response = await prismic.getByType("post", {
    pageSize: 50,
    fetch: ['post.title', 'post.content']
  });

  const posts = response.results.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      excerpt: post.data.content.find(content => content.type == "paragraph")?.text ?? '',
      updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }
  })
  
  return {
    props: { posts },
  };
}