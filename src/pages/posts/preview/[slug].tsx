/* eslint-disable react-hooks/exhaustive-deps */
import { GetStaticPaths, GetStaticProps } from "next"
import { useSession } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { RichText } from "prismic-dom"
import { useEffect } from "react"
import { getPrismicClient } from "../../../services/prismic"
import styles from "../post.module.scss"

interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  }
}

export default function PostPreview({ post } : PostPreviewProps) {
  const {data} = useSession()
  const router = useRouter()
  console.log(data);
  
  useEffect(()=>{
    if(data?.userActiveSubscription){
      router.push(`/posts/${post.slug}`)
    }
  },[data])
  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div className={`${styles.content} ${styles.previewContent}`} dangerouslySetInnerHTML={{__html: post.content}} />

          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href="/">
              <a>Subscribe now 🤗</a>
            </Link>              
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths:GetStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps:GetStaticProps = async ({ params }) => {
  const { slug } = params

  const prismic = getPrismicClient()

  const { data, last_publication_date } = await prismic.getByUID('post', String(slug), {})
  
  const post = {
    slug: String(slug),
    title: RichText.asText(data.title),
    content: RichText.asHtml(data.content.splice(0, 4)),
    updatedAt: new Date(last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 30, //30 minutos
  }
}