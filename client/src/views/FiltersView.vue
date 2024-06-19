<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="6">
          <v-card>
            <v-card-title>{{ $t('filtersView.categoriesLabel') }}</v-card-title>
            <v-card-text>
              <v-table></v-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn>{{ $t('filtersView.renameCategoryButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.deleteCategoryButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.applyCategoryButton') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card>
            <v-card-title>{{ $t('filtersView.filtersLabel') }}</v-card-title>
            <v-card-text>
              <v-table></v-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn>{{ $t('filtersView.newFilterButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.deleteFilterButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.applyFilterButton') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup></script>
