package app

import app.util.CommitCountUtil
import org.eclipse.egit.github.core.Repository
import org.eclipse.egit.github.core.RepositoryCommit
import org.eclipse.egit.github.core.User
import java.io.Serializable
import java.time.Instant
import kotlin.streams.toList

object UserCtrl {

    fun getUserProfile(username: String): UserProfile {
        if (Cache.invalid(username)) {
            val user = GhService.users.getUser(username)
            val repos = GhService.repos.getRepositories(username).filter { !it.isFork && it.size != 0 }
            val repoCommits = repos.parallelStream().map { it to commitsForRepo(it).filter 
              { it.committer?.login.equals(username, ignoreCase = true) } }.toList().toMap()
            val langRepoGrouping = repos.groupingBy { (it.language ?: "Unknown") }

            val quarterCommitCount = CommitCountUtil.getCommitsForQuarters(user, repoCommits)
            val quarterLangCommitCount = CommitCountUtil.getLangCommitsForQuarters(user, repoCommits)
            val langRepoCount = langRepoGrouping.eachCount().toList().sortedBy { (_, v) -> -v }.toMap()
            val langStarCount = langRepoGrouping.fold(0) { acc, repo -> acc + repo.watchers }.toList().sortedBy { (_, v) -> -v }.toMap()
            val langCommitCount = langRepoGrouping.fold(0) { acc, repo -> acc + repoCommits[repo]!!.size }.toList().sortedBy { (_, v) -> -v }.toMap()
            val repoCommitCount = repoCommits.map { it.key.name to it.value.size }.toList().sortedBy { (_, v) -> -v }.take(10).toMap()
            val repoStarCount = repos.filter { it.watchers > 0 }.map { it.name to it.watchers }.sortedBy { (_, v) -> -v }.take(10).toMap()

            val repoCommitCountDescriptions = repoCommitCount.map { it.key to repos.find { r -> r.name == it.key }?.description }.toMap()
            val repoStarCountDescriptions = repoStarCount.map { it.key to repos.find { r -> r.name == it.key }?.description }.toMap()

            Cache.putUserProfile(UserProfile(
                    user,
                    quarterCommitCount,
                    quarterLangCommitCount,
                    langRepoCount,
                    langStarCount,
                    langCommitCount,
                    repoCommitCount,
                    repoStarCount,
                    repoCommitCountDescriptions,
                    repoStarCountDescriptions
            ))
        }
        return Cache.getUserProfile(username)!!
    }

    fun hasStarredRepo(username: String): Boolean {
        if (Cache.contains(username)) {
            return true
        }
        if (GhService.remainingRequests == 0) {
            return false
        }
        return try {
            GhService.watchers.pageWatched(username, 1, 100).first().map { it.name }.contains("profile-summary-for-github")
        } catch (e: Exception) {
            false
        }
    }

    private fun commitsForRepo(repo: Repository): List<RepositoryCommit> = try {
        GhService.commits.getCommits(repo)
    } catch (e: Exception) {
        listOf()
    }

}

data class UserProfile(
        val user: User,
        val quarterCommitCount: Map<String, Int>,
        val quarterLangCommitCount: Map<String, Map<String, Int>>,
        val langRepoCount: Map<String, Int>,
        val langStarCount: Map<String, Int>,
        val langCommitCount: Map<String, Int>,
        val repoCommitCount: Map<String, Int>,
        val repoStarCount: Map<String, Int>,
        val repoCommitCountDescriptions: Map<String, String?>,
        val repoStarCountDescriptions: Map<String, String?>
) : Serializable {
    val timeStamp = Instant.now().toEpochMilli()
}
