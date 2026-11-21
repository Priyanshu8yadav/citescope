package com.citescope.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
    val lightColors = lightColorScheme(
        primary = Color(0xFF2563EB),        // Restrained Academic Blue
        secondary = Color(0xFF0F172A),      // Graphite Dark
        tertiary = Color(0xFF059669),       // Verified OA Emerald
        background = Color(0xFFF8FAFC),     // Soft-grey academic page
        surface = Color(0xFFFFFFFF),        // White card surface
        onBackground = Color(0xFF0F172A),   // Slate 900 text
        onSurface = Color(0xFF0F172A),      // Slate 900 text
        surfaceVariant = Color(0xFFF1F5F9), // Subtle grey
        outline = Color(0xFFE2E8F0)         // Hairline border
    )

    MaterialTheme(
        colorScheme = lightColors,
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
                            fontSize = 19.sp,
                            color = Color(0xFF0F172A)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Badge(containerColor = Color(0xFFEFF6FF)) {
                            Text("Academic Mobile", fontSize = 10.sp, color = Color(0xFF2563EB), fontWeight = FontWeight.SemiBold)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFFFFFFFF)
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFFFFFFFF)) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Search, contentDescription = "Discovery") },
                    label = { Text("Discovery", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.TableChart, contentDescription = "Matrix") },
                    label = { Text("Matrix", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Share, contentDescription = "Graph") },
                    label = { Text("Graph", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Lightbulb, contentDescription = "Gaps") },
                    label = { Text("Gaps", fontSize = 11.sp) }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
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
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White, RoundedCornerShape(8.dp)),
            placeholder = { Text("Search 250M+ research papers...", color = Color(0xFF94A3B8)) },
            trailingIcon = {
                IconButton(onClick = onSearchSubmit) {
                    Icon(Icons.Default.Search, contentDescription = "Execute Search", tint = Color(0xFF2563EB))
                }
            },
            shape = RoundedCornerShape(8.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFF2563EB),
                unfocusedBorderColor = Color(0xFFE2E8F0)
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Consensus Meter Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFFF)),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
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
                        color = Color(0xFF0F172A),
                        fontSize = 13.sp
                    )
                    Text(
                        "$affirmativeScore% Affirmative",
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF059669),
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { affirmativeScore / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    color = Color(0xFF059669),
                    trackColor = Color(0xFFE2E8F0)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    consensusText,
                    fontSize = 12.sp,
                    color = Color(0xFF475569),
                    lineHeight = 16.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF2563EB))
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
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFFF)),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${paper.year} • ${paper.venue}",
                    fontSize = 11.sp,
                    color = Color(0xFF64748B)
                )
                Text(
                    text = "${paper.citationCount} citations",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = paper.title,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = Color(0xFF0F172A),
                lineHeight = 18.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = paper.tldr,
                fontSize = 12.sp,
                color = Color(0xFF334155),
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
fun MatrixView(papers: List<Paper>) {
    Column {
        Text("Multi-Paper Comparison Matrix", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = Color(0xFF0F172A))
        Spacer(modifier = Modifier.height(6.dp))
        Text("Automated feature extraction across benchmark methodologies and datasets.", fontSize = 12.sp, color = Color(0xFF64748B))
        Spacer(modifier = Modifier.height(14.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFFF)),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Attention vs State-Space Comparison", fontWeight = FontWeight.Bold, color = Color(0xFF2563EB), fontSize = 13.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text("• Complexity: Transformers O(N^2) vs Mamba O(N)", fontSize = 12.sp, color = Color(0xFF334155))
                Text("• Memory Footprint: Mamba requires 5x less VRAM during generation", fontSize = 12.sp, color = Color(0xFF334155))
                Text("• Downstream Quality: Competitive on perplexity; attention leads on copying", fontSize = 12.sp, color = Color(0xFF334155))
            }
        }
    }
}

@Composable
fun GraphView() {
    Column {
        Text("Smart Citation Network", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = Color(0xFF0F172A))
        Spacer(modifier = Modifier.height(6.dp))
        Text("Edges categorized by scientific sentiment:", fontSize = 12.sp, color = Color(0xFF64748B))
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AssistChip(onClick = {}, label = { Text("Supporting (62%)", fontSize = 11.sp) })
            AssistChip(onClick = {}, label = { Text("Contrasting (14%)", fontSize = 11.sp) })
            AssistChip(onClick = {}, label = { Text("Mentioning (24%)", fontSize = 11.sp) })
        }
        Spacer(modifier = Modifier.height(14.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFFF)),
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "Interactive citation graph rendered in web viewer or mobile WebView.",
                    color = Color(0xFF64748B),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
fun GapsView() {
    Column {
        Text("Automated Research Gap Explorer", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = Color(0xFF0F172A))
        Spacer(modifier = Modifier.height(6.dp))
        Text("Active controversies, limitations and under-explored method-domain pairs:", fontSize = 12.sp, color = Color(0xFF64748B))
        Spacer(modifier = Modifier.height(14.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFFF)),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Opportunity Frontier #1", fontWeight = FontWeight.Bold, color = Color(0xFF2563EB), fontSize = 12.sp)
                Text("Hybrid Mamba-Attention on Edge Biomedical Devices", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Tested on: PhysioNet EEG/ECG. Opportunity Score: 94/100.", fontSize = 12.sp, color = Color(0xFF475569))
            }
        }
    }
}
