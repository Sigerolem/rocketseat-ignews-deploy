import styles from './styles.module.scss'
import { signIn, useSession, signOut } from 'next-auth/react'
import { FaGithub } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'

export function SignInButton() {

  const { data: session } = useSession();

  return session ?
    (
      <>
        <button
          className={styles.signInButton}>
          <FaGithub color="#04d361" />
          {session?.user.name}
          <FiX color="#737380" onClick={() => { signOut() }} />
        </button>
      </>
    ) :
    (
      <>
        <button
          className={styles.signInButton}
          onClick={() => { signIn('github') }}
        >
          <FaGithub color="#eba417" />
          SignIn with Github
        </button>
      </>
    )
}