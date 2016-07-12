require(dplyr)
require(data.table)
require(Rtsne)
require(readr)
require(tidyr)
require(ggplot2)
require(lintr)
require(plotly)
require(mice)
require(apcluster)

# load -------------------
df_onisep_synth <- read_csv('data/output/table_onisep.csv')
df_clusters <- read_csv('data/output/cluster_metier.csv')

# cleaning ---------------

  #clusters
df_clusters[, 1] <- NULL

names(df_onisep_synth) <- make.names(names(df_onisep_synth))
names(df_onisep_synth) <- iconv(names(df_onisep_synth), 'LATIN1', 'UTF-8')
names(df_onisep_synth) <- iconv(names(df_onisep_synth), 'UTF-8', 'ASCII//TRANSLIT')
names(df_onisep_synth) <- gsub('\\.', '_', names(df_onisep_synth))

df_onisep_synth <- df_onisep_synth %>%
  mutate(Salaire_debutant = ifelse(Salaire_debutant == "null", NA, Salaire_debutant))

df_onisep_synth$Salaire_debutant <- as.numeric(df_onisep_synth$Salaire_debutant)

imp <- mice(df_onisep_synth, seed = 1337)
df_onisep_synth <- complete(imp)

df_diplome <- df_onisep_synth %>%
  select(59:71)

test <- data.frame(data.matrix(df_diplome)%*%(1:ncol(df_diplome)))
names(test)[1] <- "diplome"
test <- test %>%
  mutate(diplome = ifelse(diplome == 0, 5, diplome))

df_onisep_synth$diplome <- factor(test$diplome, labels = names(df_diplome))


diplome_conv <- data.frame(unique(df_onisep_synth$diplome))
diplome_conv$diplome_num <- c(3, 6, 7, 9, 4, 8, 4, 13, 12, 10, 2, 1, 11)
names(diplome_conv) <- c("diplome", "diplome_num")

df_onisep_synth <- left_join(df_onisep_synth, diplome_conv, by = 'diplome')

df_onisep_synth %>%
  ggplot(., aes(x = diplome_num, y = Salaire_debutant)) +
  geom_point(alpha = 0.3) + theme_minimal()

# analysis ----------------------------------

df_train <- df_onisep_synth %>%
  mutate(Salaire_debutant = jitter(Salaire_debutant),
         Salaire_debutant_norm = (Salaire_debutant - min(Salaire_debutant)) / (max(Salaire_debutant) - min(Salaire_debutant))) %>%
  # select(-(59:71)) %>%
  select(-Salaire_debutant, -diplome, -diplome_num, -Metier) %>%
  distinct(.)

train_matrix <- as.matrix(df_train)

  #tsne_global
set.seed(1337)
tsne_global <- Rtsne(train_matrix, pca = F,
                     theta = 0.0
                     )

plot(tsne_global$Y, col=df_train$Statut_salarie)

results <- bind_cols(df_onisep_synth, data.frame(tsne_global$Y))
results <- left_join(results, df_clusters, by = "Metier")

plot_ly(results,
        x = X1, y = X2, color = results$diplome_num,
        text = results$Metier, mode = "markers")

  #tsne_secteurs
# set.seed(1337)
# tsne_secteurs <- Rtsne(train_matrix[, c(26:57, 80)], pca = F, theta = 0.0)
# 
# plot(tsne_secteurs$Y, col=df_train$Statut_salarie)
# 
# results <- bind_cols(df_onisep_synth, data.frame(tsne_secteurs$Y))
# results <- left_join(results, df_clusters, by = "Metier")
# 
# plot_ly(results,
#         x = X1, y = X2, color = results$diplome_num,
#         text = results$Metier, mode = "markers")

# ggplot(results, aes(x = X1, y = X2, color = factor(cut_complete))) +
#   geom_point()

# test <- df_diplome %>%
#   mutate(id = row.names(df_diplome)) %>%
#   gather(type, value, -id)

  # affinity propagation
## compute similarity matrix and run affinity propagation 
## (p defaults to median of similarity)
apres <- apcluster(negDistMat(r=2), tsne_global$Y, details=TRUE)

## show details of clustering results
show(apres)

## plot clustering result
plot(apres, tsne_global$Y)

## plot heatmap
heatmap(apres)

## run affinity propagation with default preference of 10% quantile
## of similarities; this should lead to a smaller number of clusters
## reuse similarity matrix from previous run
apres <- apcluster(s=apres@sim, q=0.1)
show(apres)
plot(apres, tsne_global$Y)

ap_clusters <- apres@clusters
df_ap_clusters <- data.frame(jobs_id = integer(),
                             ap_clusters = integer(),
                             stringsAsFactors = F)

df_temp <- data.frame(ap_clusters = integer(),
                      jobs_id = integer(),
                      stringsAsFactors = F)

# df_temp <- data.frame(jobs_id = ap_clusters[[1]],
#                       ap_clusters = 1)
# 
# df_temp <- bind_rows(df_ap_clusters, df_temp)

#output -----------------------
for (i in 1:length(ap_clusters)) {
  print(ap_clusters[[i]])
  df_temp <- data.frame(jobs_id = ap_clusters[[i]],
                        ap_clusters = i)
  df_ap_clusters <- bind_rows(df_ap_clusters, df_temp)
}

df_ap_clusters$jobs_id <- as.character(df_ap_clusters$jobs_id)

results$jobs_id <- row.names(results)
results <- left_join(results, df_ap_clusters, by = "jobs_id")

#viz clusters ------------------
plot_ly(results,
        x = X1, y = X2, color = factor(results$ap_clusters),
        text = results$Metier, mode = "markers")

rm(clusters_conv)
clusters_conv <- data.frame(ap_clusters = c(1:12))
clusters_conv$ap_clusters_label <- c("Rigueur et l’ordre. Il faut que la loi soit respectée. ",
                                     "J’aime autant utiliser mes mains que ma tête.",
                                     "Décortiquer des trucs complexes : j’adore.",
                                     "Hors de l’ordinaire…",
                                     "Ça part dans tous les sens dans ma tête. Et il faut que ce soit beau.",
                                     "Amoureux de la nature, des animaux, et du travail en plein air.",
                                     "Les sciences naturelles.",
                                     "Prendre soin de la nature.",
                                     "J’aime la technologie.",
                                     "En contact direct avec la technique.",
                                     "Aider les gens très directement.",
                                     "Rencontrer des nouvelles personnes au jour le jour."
                                     )

Encoding(clusters_conv$ap_clusters_label) <- "LATIN1"

results <- left_join(results, clusters_conv, by = 'ap_clusters')

output <- results
# Encoding(output$Metier) <- "UTF8" #encoding for accent
# Encoding(output$ap_clusters_label) <- "UTF8"
write.csv(output, 'data/output/results_tsne_ap_clusters.csv',
          row.names = F,
          fileEncoding = 'UTF-8')

