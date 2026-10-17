package com.citescope.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.citescope.ai.data.model.Paper
import com.citescope.ai.data.remote.CiteScopeApiService
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CiteScopeTheme {
                MainAppScreen()
            }
        }
    }
}

@Composable
fun CiteScopeTheme(content: @Composable () -> Unit) {
    val darkColors = darkColorScheme(
        primary = Color(0xFF6366F1), // Indigo Accent
        secondary = Color(0xFF06B6D4), // Cyan Accent
        tertiary = Color(0xFF10B981), // Emerald Supporting
        background = Color(0xFF0B0F19), // Deep Slate
        surface = Color(0xFF111827), // Card Surface
        onBackground = Color(0xFFF3F4F6),
        onSurface = Color(0xFFF3F4F6)
    )

    MaterialTheme(
        colorScheme = darkColors,
        typography = Typography(),
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var searchQuery by remember { mutableStateOf("Transformer") }
    var papers by remember { mutableStateOf<List<Paper>>(emptyList()) }
    var consensusText by remember { mutableStateOf("Loading empirical consensus...") }
    var affirmativeScore by remember { mutableIntStateOf(72) }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val apiService = remember { CiteScopeApiService.create() }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                isLoading = true
                val response = apiService.searchPapers(searchQuery)
                papers = response.papers
                consensusText = response.consensus.synthesis
                affirmativeScore = response.consensus.stance.affirmative
            } catch (e: Exception) {
                // Offline fallback representation
                consensusText = "68% of peer-reviewed papers report positive improvements in downstream accuracy and generalization."
                papers = listOf(
                    Paper("W1", "Attention Is All You Need", 2017, "NeurIPS", 134210, "Replaces RNNs with multi-head self-attention mechanisms."),
                    Paper("W2", "BERT: Pre-training of Deep Bidirectional Transformers", 2018, "NAACL", 98450, "Masked language model learning bidirectional context."),
                    Paper("W3", "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", 2023, "arXiv", 2840, "Linear scaling sequence modeling competitive with attention.")
                )
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "CiteScope AI",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = Color(0xFF818CF8)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Badge(containerColor = Color(0xFF06B6D4)) {
                            Text("Mobile v1.0", fontSize = 10.sp, color = Color.Black)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F19)
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF111827)) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Search, contentDescription = "Discovery") },
                    label = { Text("Discovery") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.TableChart, contentDescription = "Matrix") },
                    label = { Text("Matrix") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Share, contentDescription = "Graph") },
                    label = { Text("Graph") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Lightbulb, contentDescription = "Gaps") },
                    label = { Text("Gaps") }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Color(0xFF0B0F19))
                .padding(16.dp)
        ) {
            when (selectedTab) {
                0 -> DiscoveryView(
                    searchQuery = searchQuery,
                    onSearchChange = { searchQuery = it },
                    onSearchSubmit = {
                        scope.launch {
                            isLoading = true
                            try {
                                val res = apiService.searchPapers(searchQuery)
                                papers = res.papers
                                consensusText = res.consensus.synthesis
                                affirmativeScore = res.consensus.stance.affirmative
                            } catch (e: Exception) {
                                // fallback
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    consensusText = consensusText,
                    affirmativeScore = affirmativeScore,
                    papers = papers,
                    isLoading = isLoading
                )
                1 -> MatrixView(papers)
                2 -> GraphView()
                3 -> GapsView()
            }
        }
    }
}

@Composable
fun DiscoveryView(
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onSearchSubmit: () -> Unit,
    consensusText: String,
    affirmativeScore: Int,
    papers: List<Paper>,
    isLoading: Boolean
) {
    Column {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search 250M+ research papers...") },
            trailingIcon = {
                IconButton(onClick = onSearchSubmit) {
                    Icon(Icons.Default.Search, contentDescription = "Execute Search")
                }
            },
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Consensus Meter Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF162032)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Consensus Meter",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF67E8F9),
                        fontSize = 14.sp
                    )
                    Text(
                        "$affirmativeScore% Affirmative",
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF34D399),
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { affirmativeScore / 100f },
                    modifier = Modifier.fillMaxWidth().height(6.dp),
                    color = Color(0xFF10B981),
                    trackColor = Color(0xFF374151)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    consensusText,
                    fontSize = 12.sp,
                    color = Color(0xFF9CA3AF)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF6366F1))
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(papers) { paper ->
                    PaperItemCard(paper)
                }
            }
        }
    }
}

@Composable
fun PaperItemCard(paper: Paper) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${paper.year} • ${paper.venue}",
                    fontSize = 11.sp,
                    color = Color(0xFF818CF8)
                )
                Text(
                    text = "${paper.citationCount} citations",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFBBF24)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = paper.title,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = paper.tldr,
                fontSize = 12.sp,
                color = Color(0xFFD1D5DB)
            )
        }
    }
}

@Composable
fun MatrixView(papers: List<Paper>) {
    Column {
        Text("Multi-Paper Comparison Matrix", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Automated feature extraction across benchmark methodologies and datasets.", fontSize = 12.sp, color = Color(0xFF9CA3AF))
        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF162032)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Attention vs State-Space Comparison", fontWeight = FontWeight.Bold, color = Color(0xFF67E8F9))
                Spacer(modifier = Modifier.height(8.dp))
                Text("• Complexity: Transformers O(N^2) vs Mamba O(N)", fontSize = 13.sp, color = Color.White)
                Text("• Memory Footprint: Mamba requires 5x less VRAM during generation", fontSize = 13.sp, color = Color.White)
                Text("• Downstream Quality: Competitive on perplexity; attention leads on copying", fontSize = 13.sp, color = Color.White)
            }
        }
    }
}

@Composable
fun GraphView() {
    Column {
        Text("Smart Citation Network", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Edges categorized by scientific sentiment:", fontSize = 12.sp, color = Color(0xFF9CA3AF))
        Spacer(modifier = Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AssistChip(onClick = {}, label = { Text("🟢 Supporting (62%)") })
            AssistChip(onClick = {}, label = { Text("🔴 Contrasting (14%)") })
            AssistChip(onClick = {}, label = { Text("⚪ Mentioning (24%)") })
        }
        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF162032)),
            modifier = Modifier.fillMaxWidth().height(260.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "Interactive Cytoscape.js citation graph rendered in web viewer or mobile WebView.",
                    color = Color(0xFF818CF8),
                    fontSize = 13.sp,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
fun GapsView() {
    Column {
        Text("Automated Research Gap Explorer", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Active controversies, limitations and under-explored method-domain pairs:", fontSize = 12.sp, color = Color(0xFF9CA3AF))
        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Opportunity Frontier #1", fontWeight = FontWeight.Bold, color = Color(0xFFA5B4FC))
                Text("Hybrid Mamba-Attention on Edge Biomedical Devices", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Color.White)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Tested on: PhysioNet EEG/ECG. Opportunity Score: 94/100.", fontSize = 12.sp, color = Color(0xFFD1D5DB))
            }
        }
    }
}
